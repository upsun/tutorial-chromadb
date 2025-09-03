---
title: "Synchronize your air-gapped GitLab with Upsun"
subtitle: ""
date: 2025-07-21T02:00:00+00:00
image: /images/gitlab-push-solution/manualjob.png
icon: tutorial
featured: true
author:
  - gmoigneu

sidebar:
  exclude: true
type: post

description: |
  Configure GitLab CI/CD to deploy to Upsun from private air-gapped GitLab instances using push-based workflows and API automation
  
tags:
  - git
  - gitlab
  - ci
  - pipeline
categories:
  - tutorials
math: false
# excludeSearch: true
---

When your GitLab instance isn't accessible from the internet, you can't use Upsun's standard GitLab integration. Instead, you can create a GitLab CI/CD pipeline that pushes code to Upsun and manages environments through API calls.

This approach gives you full control over your deployment process while maintaining the security of your private GitLab instance.

## Why the standard GitLab integration won't work

The standard Upsun GitLab integration relies on a webhook-based architecture:

1. **GitLab sends webhooks** - When you push code, create branches, or open Merge Requests, GitLab sends HTTP webhooks to Upsun's servers
2. **Upsun pulls your code** - Upon receiving the webhook, Upsun attempts to connect back to your GitLab instance to pull the repository
3. **The connection fails** - Since your GitLab instance isn't accessible from the internet, Upsun can't reach it to pull the code

This webhook-pull pattern requires bidirectional connectivity between GitLab and Upsun. When your GitLab instance sits behind a firewall or on a private network, Upsun's servers can't establish the return connection needed to fetch your code.

### The push-based solution

Instead of relying on Upsun pulling from GitLab, you can implement a push-based workflow where your GitLab CI/CD pipeline actively pushes code to Upsun. This approach works because:

- Your GitLab runners can reach external services (including Upsun)
- No inbound connections to your GitLab instance are required
- You maintain full control over when and how deployments occur
- Your GitLab instance remains completely isolated from the internet

This CI/CD pipeline approach effectively reverses the flow: instead of Upsun pulling from GitLab, your pipeline pushes to Upsun, bypassing the connectivity requirements of the standard integration.

**The pipeline will take care of pushing to the `main` production environment when the branch is updated and will create preview environments whenever a new merge request is created.**

## Prerequisites

Before setting up your pipeline, you'll need:

- A GitLab runner with internet access to reach Upsun
- An Upsun project
- An [Upsun API token](https://docs.upsun.com/administration/cli/api-tokens.html#2-create-an-api-token) for environment management
- SSH keys configured on Upsun for Git operations

## Setting up authentication

### Generate an SSH key pair

Create a dedicated SSH key for your GitLab CI/CD pipeline:

```bash
ssh-keygen -t ed25519 -C "gitlab-ci@example.com" -f upsun_deploy_key
```

Grab the content of the public key:

```bash
cat upsun_deploy_key.pub | pbcopy
```

In the [Upsun interface](https://console.upsun.com/), create a new SSH key for your user:

![Add SSH Key](/images/gitlab-push-solution/ssh-key.gif)

### Configure GitLab CI/CD variables

Add these variables to your GitLab project's CI/CD settings:

- `UPSUN_PROJECT_ID`: Your Upsun project ID (e.g., `abcdefgh1234567`)
- `UPSUN_API_TOKEN`: Your Upsun API token (masked variable)
- `UPSUN_SSH_PRIVATE_KEY`: Contents of your private SSH key (It unfortunately can't be a masked variable due to the key format)
- `UPSUN_GIT_REMOTE`: Your Upsun Git remote URL
- `UPSUN_REGION`: The Upsun region the project is hosted on (`us-3.platform.sh`, `fr-1.platform.sh`, etc.)

![Gitlab Variables](/images/gitlab-push-solution/gitlab-variables.png)

## Creating the GitLab CI/CD pipeline

{{< callout type="blue" >}}
  The full `.gitlab-ci.yml` file [can be found in our GitHub snippets repository](https://github.com/upsun/snippets/blob/main/examples/gitlab-ci/push-solution.yaml).
{{< /callout >}}

Create a `.gitlab-ci.yml` file in your repository root.

Start by creating two scripts that will be referenced in the different jobs.

The first one sets up your private SSH key on the container and whitelists the Upsun git endpoint:

```yaml {filename=".gitlab-ci.yml"}
.setup_ssh: &setup_ssh
  - echo "Setup SSH"
  - mkdir -p ~/.ssh
  - echo "$UPSUN_SSH_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/id_rsa
  - chmod 600 ~/.ssh/id_rsa
  - ssh-keyscan -H git.$UPSUN_REGION >> ~/.ssh/known_hosts
```

The second is a function that will be called when we need to exchange our API token for a valid access token to actually query the API:

```yaml {filename=".gitlab-ci.yml"}
.access_token: &access_token
  - |
    export UPSUN_ACCESS_TOKEN=$(curl -u platform-api-user: \
      -d "grant_type=api_token&api_token=$UPSUN_API_TOKEN" \
      https://auth.upsun.com/oauth2/token | jq -r .access_token)
```

### Deploying to production

Once done, you can create the first job, deploying the main branch to Upsun:

```yaml {filename=".gitlab-ci.yml"}
# Deploy to production
deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl jq git openssh
    - *setup_ssh
  script:
    - |
      git config --global user.email "gitlab-ci@example.com"
      git config --global user.name "GitLab CI"
      git remote add upsun $UPSUN_GIT_REMOTE || git remote set-url upsun $UPSUN_GIT_REMOTE
      git push upsun main
  only:
    - main  # Adjust based on your default branch
```

The job is straightforward: It sets up our Git identity, sets the remote and pushes to the main branch. Since the `main` environment on Upsun is always enabled, no additional checks are required. This job will be triggered any time something happens on the main branch (merge, commit, etc.).

### Deploying preview environments for Merge Requests

For preview environments based on Merge Requests, the job will follow the same logic with some extra steps to enable the environment:

```yaml {filename=".gitlab-ci.yml"}
# Deploy on push to branches and new Merge Requests
deploy_to_upsun:
  stage: deploy
  image: alpine:latest
  before_script:
    [..]
    - *access_token
  script:
    - |
      [...]
      
      echo "Checkout branch and push to Upsun"
      git checkout -B $CI_COMMIT_REF_NAME
      git push upsun $CI_COMMIT_REF_NAME

      echo "Activate environment"
      echo "UPSUN_ACCESS_TOKEN: $UPSUN_ACCESS_TOKEN"
      curl -s -X POST \
        -H "Authorization: Bearer $UPSUN_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.upsun.com/projects/$UPSUN_PROJECT_ID/environments/main/activate"

  only:
    - merge_requests
  except:
    - main  # Adjust based on your default branch
```

The script first trades our `API_TOKEN` for an `access_token`, checks out the correct branch and then pushes it. The last step is to call the Upsun API to activate the environment.

With the above job in place, every new Merge Request created on your GitLab will trigger an environment creation on the Upsun side. Please note that the API call might throw a graceful error if the environment is already activated.

{{< callout type="blue" >}}
While the configuration triggers this job on a new Merge Request, you can change this to follow branches by switching the `only:` flag to `branches` instead. This can be done if your workflow does not rely on Merge Requests.
{{< /callout >}}

### Cleaning up unused environments

In order to not be running environments and resources for nothing, you can add a new job to clean up environments when a Merge Request is closed or merged. 

GitLab does not allow the CI script to detect exactly what happened on the Merge Request. It can only detect that _something_ happened. That's why the script uses a `manual` flag to trigger the job. A more robust solution would be to set up webhooks that call a script to handle the cleanup. 

The cleanup script includes more actions as we need to complete the following tasks:

 - Delete the Upsun remote branch
 - Deactivate the Upsun environment
 - Delete the Upsun environment

```yaml {filename=".gitlab-ci.yml"}
# Cleanup environments when branches are deleted or MRs are merged
cleanup_environment:
  stage: cleanup
  image: alpine:latest
  before_script:
    [...]
    - *access_token
  script:
    - |
      # Get the source branch name from the merge request
      BRANCH_NAME="${CI_MERGE_REQUEST_SOURCE_BRANCH_NAME}"
      
      [...]
      
      # Delete the branch from Upsun remote
      git push upsun --delete "$BRANCH_NAME" || echo "Branch already deleted from remote"
      
      # Deactivate the environment via API
      curl -s -X POST \
        -H "Authorization: Bearer $UPSUN_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.upsun.com/projects/$UPSUN_PROJECT_ID/environments/$BRANCH_NAME/deactivate" || echo "Environment deactivation failed"
      
      # Optionally delete the environment completely
      curl -s -X DELETE \
        -H "Authorization: Bearer $UPSUN_ACCESS_TOKEN" \
        "https://api.upsun.com/projects/$UPSUN_PROJECT_ID/environments/$BRANCH_NAME" || echo "Environment deletion failed"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      when: manual
  allow_failure: true
```

You can trigger this script any time by going into your GitLab pipelines view:

![Trigger cleanup](/images/gitlab-push-solution/manualjob.png)

### Deploying the script

Now that you have created the whole [.gitlab-ci.yml](https://github.com/upsun/snippets/blob/main/examples/gitlab-ci/push-solution.yaml) file, add it to your repository:

```bash
git add .gitlab-ci.yml
git commit -m "Add GitLab CI configuration"
git push origin main
```

Congratulations! That push should trigger your first pipeline.

![First pipeline](/images/gitlab-push-solution/firstpipeline.png)

## Branch name conflicts

If your branch names contain special characters, Upsun recommends converting them to safe strings:

```yaml
script:
  - SAFE_BRANCH_NAME=$(echo $CI_COMMIT_REF_NAME | sed 's/[^a-zA-Z0-9-]/-/g')
  - git push upsun HEAD:$SAFE_BRANCH_NAME
```

## Security best practices

1. **Rotate API tokens regularly** - As API tokens have no expiration, it is recommended to rotate them periodically
2. **Use protected variables** - Mark sensitive variables as protected in GitLab
3. **Limit runner access** - Use specific runner tags for deployment jobs
4. **Audit deployments** - Enable GitLab's deployment tracking


## Summary

With your GitLab CI/CD pipeline configured, you can now deploy to Upsun from your private air-gapped GitLab instance. This setup provides:

- Automatic deployments on every push
- Preview environments for Merge Requests
- Cleanup of unused environments
- Full control over your deployment process

For more advanced configurations, explore [Upsun's API documentation](https://api.upsun.com/docs) to customize environment settings, manage resources, and integrate with your existing DevOps tools.

---

[Create your Upsun account](https://upsun.com) to get started with GitLab CI/CD deployments today.
---
title: "Get more control over your environments with build variables"
#subtitle: Control over environments with build variables
date: 2021-08-10
iamge: /images/blog.jpg
featured: false
author:
  - chadwcarlson
sidebar:
  exclude: true
type: post

tags:
  - build
  - variables
  - environment
  - build-image
#categories:
#  - product
---

{{< callout >}}
Pre-release announcement: We’re making the `--visible-build` flag available as an option for environments.

{{< /callout >}}

[Environment variables](https://platform.sh/blog/we-need-to-talk-about-the-env/) are one of the primary ways to ensure 
repeatable builds on Platform.sh. They make it possible to reuse a previous build on a new branch, connecting to the 
current environment's services and other backend resources.

Today we announce that the `--visible-build` flag, previously only available at the project level, is now an option for 
environments, letting you tie your environment-specific variables to the build itself.

## A new option for making environment variables available during build

Environment-level variables have always been restricted to runtime. If you wanted a variable at build time, you needed 
to set a project-level variable with the CLI or commit it in your 
[.platform.app.yaml](https://docs.platform.sh/overview/yaml/what-is-yaml.html) file. In both cases, visibility at build 
time meant that it was a part of the build image, something that should be considered almost like code. The build image 
is at its core environment-agnostic, and it can be reused and moved to new environments freely until you change the 
build process in some way, which gives you a lot of confidence when merging.

But there are times where you want a variable specific to one environment, such as distinguishing whether a Node.js s
erver should run in `production` or `development`, available at build time. For this reason, we've enabled the
`--visible-build` flag for variable creation [at the environment level](https://docs.platform.sh/development/variables.html).
If we continue with the Node.js example, we can consider the following commands:

```bash {filename="Terminal"}
$ platform variable:create -l environment -e main --prefix env: --name NODE_ENV --value production --visible-build true --inheritable false
$ platform variable:create -l environment -e staging --prefix env: --name NODE_ENV --value development --visible-build true --inheritable true
```

In the first command, we’ve set `NODE_ENV` to `production` for the default branch, which makes sense for our production 
application. In the second command, however, the variable is set to `development` for the `staging` environment, and it
will be inherited into each development environment that branches from it. This can be useful for running a much larger 
test suite than you would run in production on each development environment, for 
[enabling incremental builds](https://platform.sh/blog/headless-but-this-time-live-decoupled-drupal-with-gatsby/) with your
[decoupled applications](https://platform.sh/blog/time-to-breakup-three-reasons-to-decouple-your-application/), or for 
providing write access at runtime for a backend headless CMS like Strapi (where it's forbidden in production).

## What’s changed

Introducing the `--visible-build` flag to environment-level variables is just one part of this release. There is another
potentially breaking change that you should keep in mind going forward. In the past, if you wanted to trigger a rebuild 
on your app, you could simply add a small change, even a white space change, to your `.platform.app.yaml` file.

With this release, this is no longer the case. The `.platform.app.yaml` file itself is not a part of the build slug 
reused across environments, nor is it available at all during builds. Instead, it’s only a subset of the values included 
in that file—those attributes relevant to builds rather than runtime—that are tied to the slug.

For example, changing the version of Node.js your app uses will cause a full rebuild, whereas modifying the `post_deploy` 
hook will not. Runtime keys that will no longer trigger rebuilds (but still trigger redeploys) when updated include:

- everything under `resources`
- `size`
- `disk`
- everything under `access`
- everything under `relationships`
- everything under `firewall`
- `hooks.deploy` and `hooks.post_deploy`
- everything under `web` except `web.mounts`
- everything under `workers` except `workers.X.mounts`
- everything under `crons`

While the `.platform.app.yaml` file isn’t available at build time anymore, you can still retrieve that information from
the `PLATFORM_APPLICATION` environment variable. But it will only include those attributes included in the build slug, 
and none of those listed above (that is, until deploy time).

(The `.platform.app.yaml` file not being available during build means that it is not part of the tree of the application, 
which also influences how the `PLATFORM_TREE_ID` variable is generated. If you compute this value yourself somewhere—we 
never documented it, so you know who you are—you will now need to exclude the `.platform.app.yaml`. This should 
otherwise not be of concern for most people.)

You can read about these changes in more detail in our updated
[variables documentation](https://docs.platform.sh/development/variables.html#variables-available-during-builds-and-at-runtime).

## An example: Using build environment variables to trigger a rebuild through a source operation

Build environment variables can change a lot of things for your apps. These variables now can become a part of the build 
image, the same as project variables. This option opens up some interesting possibilities for fleets by creating a kind 
of `platform rebuild` command if set up right.

In a previous article, I described a few options for maintaining a 
[content delivery fleet](https://platform.sh/blog/source-operations-sorcery-summoning-the-multiheaded-gatsby-fleet/) on Platform.sh. The 
example I used was a Drupal content store, decoupled from any number of frontend Gatsby presentation apps, that would 
consume and present content across afleet. Thee apps could customize how the content was presented—such as whether it 
was displayed on a mobile, desktop, gaming, or any other device—and then get triggered from the backend
[regularly via cron or automatically using a custom Drupal module](https://www.youtube.com/watch?v=qe_kXyruPYc) to 
rebuild themselves using new content.

Build environment variables provide another method for triggering a rebuild through a
[source operation](https://docs.platform.sh/configuration/app/source-operations.html). The Drupal store example used a 
dummy commit to a file in the repository root using the current date:

```yaml {filname=".platform.app.yaml"}
source:
  operations:
    update:
      command: |
        echo Last Content Update:  $(date) > counter.txt
        echo "Create dummy commit to force rebuild for updated content."
        git commit -am "Source Operation: Updated content from backend."
```

If instead we create a `FRONTEND_REBUILD_COUNTER` variable for our presentation app:

```bash {filename="Terminal"}
$ platform variable:create -l environment -e main --prefix env: --name FRONTEND_REBUILD_COUNTER --value 1` --visible-build true --inheritable false
```

We can redefine the source operation to increment the environment variable instead:

```yaml {filname=".platform.app.yaml"}
source:
  operations:
    update:
      command: |
        platform variable:update FRONTEND_REBUILD_COUNTER $((FRONTEND_REBUILD_COUNTER+1))
```

Build variables are a part of the build slug, so simply updating their value will trigger a rebuild of, in this case, 
the frontend Gatsby app with the latest content.

No doubt you have many ideas for additional places where the `--visible-build` flag will be useful. Feel free to share 
them with us on our [community site](https://community.platform.sh).
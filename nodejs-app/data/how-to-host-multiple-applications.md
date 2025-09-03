---
title: "How to host a multiple-application project on Platform.sh"
#subtitle: 
date: 2024-08-16T10:00:00+00:00
image: /images/multiple-application-blog.png
#icon: tutorial
featured: false
author:
  - flovntp

sidebar:
    exclude: true
type: post
    
tags:
  - gatsby
  - symfony
  - api-platform-admin
  - mercure-rocks
#categories:
#  - featured
#  - tutorials

---
We’re here to shed a little light on **how you can host and configure your multiple-application projects on 
Platform.sh** with a step-by-step guide on how to set up a project on our platform. Enabling your team to focus more on 
creating incredible user experiences and less on multiple-application infrastructure management. As well as a few 
multiple-application development tips along the way.

We’re going to look at this through the lens of a customer on the lookout for 
[multi-application hosting](https://platform.sh/blog/apps-hosting/) with a few specific constraints. These constraints 
are:

* A backend using [API Platform Admin component](https://api-platform.com/docs/admin/)
* A legacy frontend, hosting an API and a corporate frontend, developed with [Symfony 6.2](https://symfony.com/doc/6.2/index.html)
* A white label frontend developed with [Gatsby](https://www.gatsbyjs.com/), consuming the “Legacy” API
* A [Mercure Rocks](https://www.gatsbyjs.com/) server for marketing purposes (push notifications)
* All customer sources on a public [GitHub repo](https://github.com/platformsh-templates/bigfoot-multiapp)

### **How to start hosting your multiple-application project with Platform.sh**

#### **1. Create a Platform.sh account**

If you already have an account, you can skip this step. If not, you firstly need to create an account on 
[Platform.sh](https://auth.api.platform.sh/?_utm_medium=Email&_utm_campaign=2022-09-newsletter&_utm_source=devrelcareers) using your Github, Google, Bitbucket, or GitLab account.

#### **2. Create a Platform.sh project**

Now that you have your Platform.sh account set up, it’s time to create a project. On the 
[homepage](https://console.platform.sh/?_utm_medium=Email&_utm_campaign=2022-09-newsletter&_utm_source=devrelcareers) of
your console, click on the ‘Create Project’ button on the top right corner and choose the second option to create a 
project from scratch.

Then all you have to do is name it and select a region from the list. Please remember to always respect data sovereignty 
and we always encourage our users to choose a region with low-carbon consumption for their deployment. The production 
environment and organization can remain the same. After validation, which will take a few minutes, your project will be 
created—it’s as simple as that!

#### **3. Edit your plan for optimal storage**

Multiple-application projects often need more storage than what’s included in the typical Platform.sh default 
development plan. Much like [this Bigfoot project](https://github.com/platformsh-templates/bigfoot-multiapp) is used 
using for some apps, the Node modules consume at least 2GB of storage and so for the 4 applications needed to classify 
it as a multiple-application project, that number increases to 9GB of storage.

To add more set up this enhanced storage, in the top right corner of your project overview in the console, click on the 
‘More’ button—represented as 3 dots—and choose ‘Edit Plan’ which you can see in the image below. From there, go to the 
‘Storage’ section and select the 10GB option, then select ‘Save.’ And if you want to go back to your project from there,
just use the back button in your browser.

#### **4. Creating a fork of BigFoot multiple-application repository**

To be able to perform the following steps in this process, you first need to create your own repository—i.e. fork—in 
Github as you won’t be able to change anything from the main repository. To do so, simply follow the steps in 
[this Github article](https://docs.github.com/en/get-started/quickstart/fork-a-repo) to create a fork from 
[our BigFoot multiple-application project](https://github.com/platformsh-templates/bigfoot-multiapp) to your own Github
organization. This Bigfoot multiple-application project has a backend using API Platform, a frontend+API using Symfony, 
a white label frontend using Gatsby, and a Mercure Rocks server.

After creating your fork, please clone it locally and open it in your favorite integrated development environment (IDE). 
If you’re using [PHPStorm](https://www.jetbrains.com/phpstorm/), remember to install this amazing 
[Platform.sh plugin](https://plugins.jetbrains.com/plugin/18729-platform-sh) designed to help with Platform.sh YAML 
config files.

```bash {filename="Terminal"}
$ git clone https://github.com/<YourOrgName>/bigfoot-multiapp bigfoot-multiapp
$ cd bigfoot-multiapp
```

Then remember to replace the **\<YourOrgName\>** value with your own Github repository.

#### **5. Add GitHub integration**

Platform.sh provides a feature called [Github integration](https://docs.platform.sh/integrations/source/github.html) 
that allows your Platform.sh project to be fully integrated with your Github repository. This integration enables you to
use the normal Git workflow to deploy your environment—with no need to connect to the
[Platform.sh console](https://console.platform.sh/?_utm_medium=Email&_utm_campaign=2022-09-newsletter&_utm_source=devrelcareers).

To enable Github integration on your project, follow these 5 simple steps:

1. From your Platform.sh console of your project, on the top right corner, click on the **Settings** button (represented
as a wheel).
2. In the left menu, from the **Project Settings** section, choose **Integrations** and select **GitHub**.
3. Fill out the form with your [access token](https://docs.platform.sh/integrations/source/github.html#1-generate-a-token) 
and select your forked project.
4. Choose the [sync options](https://docs.platform.sh/integrations/source/github.html#2-enable-the-integration) that are
needed for your project.
5. Submit the form using the **add integration** button.

Then all you need to do is wait for the integration to build all the corresponding environments. If you find that the 
integration doesn’t seem to be working properly, the first thing you should do is validate the integration via the 
following steps.

In parallel to the instructions above, use the [Platform.sh CLI](https://docs.platform.sh/administration/cli.html) to 
validate your integration, using this command line:

```bash {filename="Terminal"}
$ platform integration:validate <integrationId>
```

{{< callout >}}
**Please note**: Throughout these steps, your **main** environment deployment should be failing with the following error.
This is the expected error as you won’t have created config files yet so don’t worry about that.
{{< /callout >}}

```bash 
E: Error parsing configuration files: - applications: No `.platform.app.yaml` file found
anywhere in the repository. - routes: Error loading file: No `.platform/routes.yaml` file
found in the repository.
```

#### **6. Set a remote to your Platform.sh project**

In order to ease interaction from your terminal with your Platform.sh project, you need to set a remote using this CLI 
command:

```bash {filename="Terminal"}
 platform project:set-remote <projectID>
```

{{< callout >}}
**Please note**: your `<projectID>` can be found in the 
[console interface of your project](https://console.platform.sh/?_utm_medium=Email&_utm_campaign=2022-09-newsletter&_utm_source=devrelcareers), 
or by finding it in your project list, as shown below:
{{< /callout >}}

```bash {filename="Terminal"}
$ platform project:list
```

#### **7. Configure your project**

To configure your multiple-application project, there are a few basic rules:

* **.platform/** folder, containing routing, services, and application configuration files shared across all apps, needs to stay at the root of your source code.
* The name of the configuration files is fixed: **routes.yaml, services.yaml, applications.yaml** or **.platform.app.yaml** if you want to configure apps individually.
* Yaml format is used for config files.
* Each app has a id:

    * **admin**: API Platform Admin component
    * **api**: BigFoot API \+ default frontend
    * **gatsby**: Gatsby frontend
    * **mercure**: Mercure Rocks Server
* App source code can be split into separate repositories and use [Git Submodules](https://docs.platform.sh/create-apps/multi-app.html#configuration-separate-from-code-git-submodules). To find out more, please stay tuned, another blogpost is coming that will cover this subject.

##### **Step 1: Configure routing and services**

[Platform.sh Yaml configuration](https://docs.platform.sh/learn/overview/yaml.html) needs at least 3 Yaml files for your
project to be deployed and the locations of these files are the root of your source code, in the **.platform/** folder.

The **.platform/** folder contains 3 config files, each with their own function, as you can see in the list and example below:

* **routes.yaml** for routing
* **services.yaml** for services
* **applications.yaml** that will control behavior of all your applications in a single file,

```bash 
├── .platform
│   ├── routes.yaml
│   ├── services.yaml
│   └── applications.yaml
└── <project sources>
```

To configure your project, you first need to create a new **.platform/routes.yaml** file with following configuration:

```yaml {filename=".platform/routes.yaml"}
# BigFoot API
https://{default}:
  type: upstream
  # the first part should be your project name
  upstream: "api:http"
  id: api

# API Platform Admin component
https://{default}/admin:
  type: upstream
  # the first part should be your project name
  upstream: admin:http
  id: admin
  cache:
    cookies: ['*']
    default_ttl: 0
    enabled: true
    headers: [Accept, Accept-Language]
  ssi:
    enabled: false

# Gatsby App
https://{default}/site:
  type: upstream
  # the first part should be your project name
  upstream: "gatsby:http"
  id: gatsby

# Mercure Rocks app
https://mercure.{default}:
  type: upstream
  # the first part should be your project name
  upstream: "mercure:http"
  id: mercure
  cache:
    enabled: false
```

{{< callout >}}
**Please note**: each of the routes have an id which must be unique and is equal to the name of the application (please 
see [configure](https://platform.sh/blog/how-to-host-multiple-applications/#configure) section)
{{< /callout >}}

You have to then create a new **.platform/services.yaml** file with the following configuration. The database for which will be used by your app **api**.

```yaml {filename=".platform/services.yaml"}
database:
  type: postgresql:15
  disk: 1024
```

Finally, to complete this step and create your third and final yaml file, you should configure your **api** app by 
creating a **.platform/applications.yaml** file with following configuration:

```yaml {filename=".platform/applications.yaml"}
# Complete list of all available properties: https://docs.platform.sh/create-apps/app-reference.html

# A unique name for the app
api:
  # The runtime the application uses.
  type: php:8.2
  # The relationships of the application with services or other applications.
  relationships:
    database: "database:postgresql"
  # The size of the persistent disk of the application (in MB). Minimum value is 128.
  disk: 2048
  # Mounts define directories that are writable after the build is complete. If set as a local source, disk property is required.
  mounts:
    "/var/cache": "local:files/cache"
    "/var/log": "local:files/log"
    "/var/sessions": "local:files/sessions"
  # The web key configures the web server running in front of your app.
  web:
    # Each key in locations is a path on your site with a leading /.
    locations:
      "/":
        root: "public"
        passthru: '/index.php'
        index:
          - index.php
        scripts: true
        allow: true
        headers:
          Access-Control-Allow-Origin: "*"
  # Variables to control the environment.
  variables:
    env:
      APP_ENV: 'prod'
    php:
      assert.active: off
  # Specifies a default set of build tasks to run. Flavors are language-specific.
  build:
    flavor: composer
  # Hooks allow you to customize your code/environment as the project moves through the build and deploy stages
  hooks:
    # The build hook is run after any build flavor.
    build: |
      set -x -e
      curl -s https://get.symfony.com/cloud/configurator | bash
      symfony-build
    # The deploy hook is run after the app container has been started, but before it has started accepting requests.
    deploy: |
      set -x -e
      symfony-deploy
  # Scheduled tasks for the app.
  crons:
    update-sighting:
      spec: '*/5 * * * *'
      cmd: './bin/console app:update-sighting-scores'
  # Customizations to your PHP or Lisp runtime.
  runtime:
    extensions: [ctype, iconv, apcu, mbstring, sodium, xsl, pdo_pgsql]
  # Information on the app's source code and operations that can be run on it.
  source:
    # The path where the app code lives. Defaults to the directory of the .platform.app.yaml file. Useful for multi-app setups.
    root: api
```

{{< callout >}} 
**Please note**: As the Platform.sh config file is not in the same directory as your **api** app sources, we then need 
to configure the `source.root` section with the corresponding **api** directory.
{{< /callout >}}

##### **Step 2: Configure the api application**

To configure **the** environment variables, specific to Platform.sh for the **api** application, create an 
**api/.environment** file. When present, this file will be sourced in the applications’ environment before loading any 
other environment variables such as those present in a **.env** file.

```text {filename="api/.environment"}
export N_PREFIX=$HOME/.n
export PATH=$N_PREFIX/bin:$PATH

# Set dynamic CORS_ALLOW_ORIGIN for NelmioBundle
export CORS_ALLOW_ORIGIN=^(https://)?.*$(echo $PLATFORM_PROJECT)..*.platformsh.site
export TRUSTED_HOSTS=^(https://)?.*$(echo $PLATFORM_PROJECT)..*.platformsh.site
export TRUSTED_PROXIES=^(https://)?.*$(echo $PLATFORM_PROJECT)..*.platformsh.site

# Admin Site Name
export API_SITE_NAME="API Platform.sh"

export APP_SECRET=$(echo $PLATFORM_PROJECT_ENTROPY)

# Mercure Rocks uri
export MERCURE_URL=$(echo $PLATFORM_ROUTES | base64 --decode | jq -r 'to_entries[] | select(.value.id == "mercure") | .key'| awk '{print substr($0, 0, length($0))}')
export MERCURE_PUBLIC_URL=$(echo $PLATFORM_ROUTES | base64 --decode | jq -r 'to_entries[] | select(.value.id == "mercure") | .key'| awk '{print substr($0, 0, length($0))}')
export MERCURE_PUBLISH_URL=$(echo $PLATFORM_ROUTES | base64 --decode | jq -r 'to_entries[] | select(.value.id == "mercure") | .key'| awk '{print substr($0, 0, length($0))}')

# The secret used to sign the JWTs
export MERCURE_JWT_SECRET="!ChangeThisMercureHubJWTSecretKey!"
```

##### **Step 3: Configure admin**

Configure **admin** app by adding the following configuration at the end of the existing **.platform/applications.yaml** 
file:

```yaml {filename=".platform/applications.yaml"}
# Complete list of all available properties: https://docs.platform.sh/create-apps/app-reference.html

# A unique name for the app
admin:
  # The runtime the application uses.
  type: nodejs:16
  # How many resources to devote to the app. Defaults to AUTO in production environments.
  size: L
  # Fine-tune allocated resources
  resources:
    base_memory: 1024
    memory_ratio: 1024
  # The size of the persistent disk of the application (in MB). Minimum value is 128.
  disk: 1024
  # Mounts define directories that are writable after the build is complete. If set as a local source, disk property is required.
  mounts:
    '/.tmp_platformsh': 'local:files/tmp_platformsh'
    '/build': 'local:files/build'
    '/.cache': 'local:files/.cache'
    '/node_modules/.cache': 'local:files/node_modules/.cache'
  # The web key configures the web server running in front of your app.
  web:
    # Each key in locations is a path on your site with a leading /.
    locations:
      "/admin":
        root: "build"
        passthru: "/admin/index.html"
        index:
          - "index.html"
        expires: 300s
        scripts: true
        allow: true
        rules:
          .(css|js|gif|jpe?g|png|ttf|eot|woff2?|otf|html|ico|svg?)$:
            allow: true
          ^/admin/robots.txt$:
            allow: true
          ^/admin/manifest.json$:
            allow: true
          ^/admin/_next:
            allow: true
          ^/admin/sitemap:
            allow: true
        headers:
          Access-Control-Allow-Origin: "*"
  # Variables to control the environment.
  variables:
    env:
      NODE_OPTIONS: '--max-old-space-size=1536'
  # Specifies a default set of build tasks to run. Flavors are language-specific.
  build:
    flavor: none
  # Hooks allow you to customize your code/environment as the project moves through the build and deploy stages
  hooks:
    # The build hook is run after any build flavor.
    build: |
      set -eu
      corepack yarn install --immutable --force
    # The post_deploy hook is run after the app container has been started and after it has started accepting requests.
    post_deploy: |
      corepack yarn run build
  # Information on the app's source code and operations that can be run on it.
  source:
    # The path where the app code lives. Defaults to the directory of the .platform.app.yaml file. Useful for multi-app setups.
    root: admin
```

{{< callout >}}
**Please note**: as the defined **admin** route is `https://{default}/admin`, you need to report suffix `/admin` in the
`web.locations` section. And considering the Platform.sh config file is not in the same directory as your **admin** app 
sources, we need to configure the `source.root` section with corresponding **admin** directory.
{{< /callout >}}

Then, to configure the **admin** environment variable specific to Platform.sh hosting create an **admin/.environment** 
file. This file will be performed on top of the default **.env** file.

```text {filename="admin/.environment"}
export REACT_APP_PUBLIC_URL=$(echo $PLATFORM_ROUTES | base64 --decode | jq -r 'to_entries[] | select(.value.id == "api") | .key')api
export PUBLIC_URL=$(echo $PLATFORM_ROUTES | base64 --decode | jq -r 'to_entries[] | select(.value.id == "admin") | .key')

# Admin Site Name
export REACT_APP_ADMIN_SITE_NAME="Admin API Platform.sh"
```

##### **Step 4: Configure gatsby**

To configure the **gatsby** app add the following configuration at the end of the existing 
**.platform/applications.yaml** file:

```yaml {filename=".platform/applications.yaml"}
# Complete list of all available properties: https://docs.platform.sh/create-apps/app-reference.html

# A unique name for the app
gatsby:
  # The runtime the application uses.
  type: 'nodejs:18'
  # How many resources to devote to the app. Defaults to AUTO in production environments.
  size: L
  # Fine-tune allocated resources
  resources:
    base_memory: 1024
    memory_ratio: 1024
  # The size of the persistent disk of the application (in MB). Minimum value is 128.
  disk: 1536
  # Mounts define directories that are writable after the build is complete. If set as a local source, disk property is required.
  mounts:
    '/.cache': { source: local, source_path: "cache" }
    '/.config': { source: local, source_path: "config" }
    '/public': { source: local, source_path: "public" }
  # The web key configures the web server running in front of your app.
  web:
    # Each key in locations is a path on your site with a leading /.
    locations:
      '/site':
        root: 'public'
        index: [ 'index.html' ]
        scripts: false
        allow: true
  # Variables to control the environment.
  variables:
    env:
      NODE_OPTIONS: --max-old-space-size=1536
  # Specifies a default set of build tasks to run. Flavors are language-specific.
  build:
    flavor: none
  # Installs global dependencies as part of the build process.
  dependencies:
    nodejs:
      yarn: "1.22.17"
  # Hooks allow you to customize your code/environment as the project moves through the build and deploy stages
  hooks:
    # The build hook is run after any build flavor.
    build: |
      set -e
      yarn --frozen-lockfile
    # The post_deploy hook is run after the app container has been started and after it has started accepting requests.
    post_deploy: |
      yarn build --prefix-paths
  # Information on the app's source code and operations that can be run on it.
  source:
    # The path where the app code lives. Defaults to the directory of the .platform.app.yaml file. Useful for multi-app setups.
    root: gatsby
```
{{< callout >}}
**Please note**: as the gatsby route is https://{default}/site you need to report this suffix /site in the 
web.locations section. And due to Platform.sh config file not being in the same directory as your gatsby app sources, 
we need to configure the source.root section with corresponding gatsby directory.
{{< /callout >}}

##### **Step 5: Configure mercure**

Configure **mercure** app by adding the following configuration at the end of the existing 
**.platform/applications.yaml** file:

```yaml {filename=".platform/applications.yaml"}
# Complete list of all available properties: https://docs.platform.sh/create-apps/app-reference.html

# A unique name for the app
mercure:
  # The runtime the application uses.
  type: golang:1.18
  # How many resources to devote to the app. Defaults to AUTO in production environments.
  size: L
  # The size of the persistent disk of the application (in MB). Minimum value is 128.
  disk: 2048
  # Mounts define directories that are writable after the build is complete. If set as a local source, disk property is required.
  mounts:
    "database": { source: local, source_path: "database" }
    "/.local": { source: local, source_path: .local }
    "/.config": { source: local, source_path: .config }
  # The web key configures the web server running in front of your app.
  web:
    # Commands are run once after deployment to start the application process.
    commands:
      # The command to launch your app. If it terminates, it's restarted immediately.
      start: ./mercure run --config Caddyfile.platform_sh
    # Each key in locations is a path on your site with a leading /.
    locations:
      /:
        root: ""
        passthru: true
        scripts: false
        allow: true
        request_buffering:
          enabled: false
        headers:
          Access-Control-Allow-Origin: "*"
  # Variables to control the environment.
  variables:
    env:
      MERCUREVERSION: 0.14.4
      SERVER_NAME: ":8888"
      MERCURE_TRANSPORT_URL: "bolt:///var/run/mercure.db?size=1000&cleanup_frequency=0.5"
      MERCURE_EXTRA_DIRECTIVES: |
        cors_origin *
        publish_origins *
        subscriptions
        demo
      GLOBAL_OPTIONS: |
        auto_https off
      MERCURE_PUBLISHER_JWT_KEY: "!ChangeThisMercureHubJWTSecretKey!"
      MERCURE_SUBSCRIBER_JWT_KEY: "!ChangeThisMercureHubJWTSecretKey!"
  # Specifies a default set of build tasks to run. Flavors are language-specific.
  build:
    flavor: none
  # Hooks allow you to customize your code/environment as the project moves through the build and deploy stages
  hooks:
    # The build hook is run after any build flavor.
    build: |
      # Install Mercure using cache
      FILE="mercure_${MERCUREVERSION}_Linux_x86_64.tar.gz"
      if [ ! -f "$PLATFORM_CACHE_DIR/$FILE" ]; then
        URL="https://github.com/dunglas/mercure/releases/download/v${MERCUREVERSION}/$FILE"
        wget -O "$PLATFORM_CACHE_DIR/$FILE" $URL
      else
        echo "Found $FILE in cache, using cache"
      fi
      file $PLATFORM_CACHE_DIR/$FILE
      tar xvzf $PLATFORM_CACHE_DIR/$FILE
  # Information on the app's source code and operations that can be run on it.
  source:
    # The path where the app code lives. Defaults to the directory of the .platform.app.yaml file. Useful for multi-app setups.
    root: mercure/.config
```

{{< callout >}}
**Please note**: as Platform.sh config file is not in the same directory as your mercure app sources, we need to 
configure the `source.root` section with corresponding **mercure** directory.
{{< /callout >}}

To configure the **mercure** environment variable specific to Platform.sh hosting create a **mercure/.environment** 
file. This file will be performed on top of the default .env file.

```text {filename="mercure/.environment"}
export PSH_SITE_URL="$(echo "$PLATFORM_ROUTES" | base64 --decode | jq -r 'to_entries[] | select(.value.upstream=="mercure") | .key' | awk '{print substr($0, 0, length($0))}')"
export MERCURE_PUBLISHER_JWT_KEY="!ChangeThisMercureHubJWTSecretKey!"
export MERCURE_SUBSCRIBER_JWT_KEY="!ChangeThisMercureHubJWTSecretKey!"
export MERCURE_EXTRA_DIRECTIVES="
  cors_origin *
  publish_origins *
  demo true
  anonymous
  subscriptions"
export GLOBAL_OPTIONS="auto_https off"
export MERCURE_TRANSPORT_URL="bolt:///var/run/mercure.db"
export SERVER_NAME=":8888"
```

Et voilà, your project is ready to be pushed to Platform.sh!!

#### **8. Push your code**

Now your source code contains all necessary Platform.sh configuration files, you can use the normal Git process to push 
your code to your fork repository as seen below:

```bash {filename="Terminal"}
$ git add . && git commit -m "configure project for Platform.sh" && git push
```

After the push, the Github integration process will handle deploying your main environment with all your recent code 
updates.

#### **9. Populate the data**

The Bigfoot app (api app) contains fixtures that could be populated into the database. To do so, complete the following 
commands:

```bash {filename="Terminal"}
$ platform ssh --app=api "php bin/console d:s:u --dump-sql --force"
$ platform ssh --app=api "php bin/console d:f:load -e dev"
```

#### **10. Open your online websites**

Your multiple applications project is now live and you should test it. To open one of your websites, you can either use 
the Console interface or use following CLI command and then choose one of the listed routes:

```bash {filename="Terminal"}
$ platform environment:url
```

#### **11. Create a staging environment**

To create a new environment on our project, we need to create a new Git branch, push it to the Github repository, and 
then the Github integration process will automatically create the environment. To do so, complete the following commands:

```bash {filename="Terminal"}
$ git checkout -b staging
$ git push --set-upstream origin staging
```

Remember that each time you create and push a new Git branch, 
[Github integration](https://docs.platform.sh/integrations/source/github.html) generates a new
[inactive environment](https://docs.platform.sh/other/glossary.html#inactive-environment) within your Platform.sh 
project. As the environment is inactive by default, you need to activate it to deploy it by doing the following:

```bash {filename="Terminal"}
$ platform env:info type staging
$ platform env:activate staging
```

#### **12. Create dev environment**

Now it’s time to create a new dev environment by creating a new Git branch from the staging one by doing the following:

```bash {filename="Terminal"}
$ git checkout -b dev
$ git push --set-upstream origin dev
```

Remember that each time you create and push a new Git branch,
[Github integration](https://docs.platform.sh/integrations/source/github.html) generates a new
[inactive environment](https://docs.platform.sh/other/glossary.html#inactive-environment) within your Platform.sh 
project. As the environment is inactive by default, you need to activate it to deploy it:

```bash {filename="Terminal"}
$ platform env:info type development
$ platform env:activate dev
```

And the Git guides don’t stop there, stay tuned for our next article on Git submodules coming very soon. Remain 
up-to-date on the latest from us over on our social media and community channels: [Dev.to](https://dev.to/platformsh), 
[Reddit](https://dev.to/platformsh), [Twitter](https://twitter.com/platformsh), and 
[Slack](https://join.slack.com/share/enQtNTg0OTY4MjM3Nzg3NS0xZDk0OGI5ZjViZmYwMGZlY2Q0MzIyNmM2ZjhmYmI4ZmRjNDcxZjgyYzM1MDA1MjlhYzYwMGU1YzZkOWQzZjQ5).

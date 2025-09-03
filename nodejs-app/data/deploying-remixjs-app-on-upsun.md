---
title: "Deploying a Remix JS app on Upsun in 5 minutes"
subtitle: ""
date: 2024-03-01T02:00:00+00:00
#image: /images/mcp-interaction-types-article.png
icon: tutorial
featured: true
author:
  - gmoigneu

sidebar:
  exclude: true
type: post

description: |
  Learn how to deploy a Remix JS application on Upsun in just 5 minutes. This tutorial covers creating a project, setting up the Node.js server, and deploying your app.
  
tags:
  - remix
  - remixjs
  - javascript
  - nodejs
  - deployment
  - upsun
categories:
  - tutorials
math: false
# excludeSearch: true
---

Deploying any JavaScript/Node based framework on Upsun is easy. But as Remix does not have any bundled web server, let's see how we can run it.

We will implement and deploy the [Remix Tutorial](https://remix.run/docs/en/main/start/tutorial) here so you can refer to it if you need to grab the actual code.

## Initializing the Remix application
Let's start by initializing our application:

```bash {filename="Terminal"}
npx create-remix@latest --template remix-run/remix/templates/remix-tutorial remix
Need to install the following packages:
create-remix@2.8.0
Ok to proceed? (y)

 remix   v2.8.0 💿 Let's build a better website...
      ◼  Directory: Using remix as project directory

      ◼  Template: Using remix-run/remix/templates/remix-tutorial...
      ✔  Template copied

   git   Initialize a new git repository?
         Yes

  deps   Install dependencies with npm?
         Yes

      ✔  Dependencies installed

      ✔  Git initialized

  done   That's it!

         Enter your project directory using cd ./remix
         Check out README.md for development and deploy instructions.
```

We can start it locally with `npm run dev`:

```bash {filename="Terminal"}
npm run dev

> dev
> remix dev --manual

 💿  remix dev

 info  building...
 info  built (234ms)
[remix-serve] http://localhost:3000 (http://10.1.10.29:3000)
```
We have followed the amazing tutorial and we are now presented with a fully working application:

![Remix Application](/images/deploying-remixjs-app-on-upsun/1_x2OZxpOUL42rVP5IzPJjtA.gif)

Don't forget to commit your changes to the local repository.

## Creating the Upsun configuration

Let's move to the fun part. Make sure your Upsun CLI is installed and logged in with `upsun login`.

We now need to create a new project to deploy our Remix. We will use `upsun project:create`:

```bash {filename="Terminal"}
upsun project:create

Selected organization: Nls (nls) (by default)
Creating a project under the organization Nls (nls)

* Project title (--title)
Default: Untitled Project
> Remix Deploy

* Region (--region)
The region where the project will be hosted.
Get a 3% discount on resources for regions with a carbon intensity of less than 100 gCO2eq/kWh.
  [au.platform.sh  ] Sydney, Australia (AWS)  [545 gC02eq/kWh]
  [au-2.platform.sh] Sydney, Australia (AZURE)  [545 gC02eq/kWh]
  [ca-1.platform.sh] Montreal, Canada (AWS)  [31 gC02eq/kWh]
  [ch-1.platform.sh] Zurich, Switzerland (GCP)  [91 gC02eq/kWh]
  [de-2.platform.sh] Frankfurt, Germany (GCP)  [416 gC02eq/kWh]
  [eu.platform.sh  ] Dublin, Ireland (AWS)  [386 gC02eq/kWh]
  [eu-2.platform.sh] Dublin, Ireland (AWS)  [386 gC02eq/kWh]
  [eu-4.platform.sh] Dublin, Ireland (AWS)  [386 gC02eq/kWh]
  [eu-5.platform.sh] Stockholm, Sweden (AWS)  [23 gC02eq/kWh]
  [fr-3.platform.sh] Gravelines, France (OVH)  [59 gC02eq/kWh]
  [fr-4.platform.sh] Paris, France (AZURE)  [59 gC02eq/kWh]
  [uk-1.platform.sh] London, United Kingdom (GCP)  [200 gC02eq/kWh]
  [us.platform.sh  ] Washington, United States (AWS)  [396 gC02eq/kWh]
  [us-2.platform.sh] Washington, United States (AWS)  [396 gC02eq/kWh]
  [us-3.platform.sh] Moses Lake, United States (AZURE)  [56 gC02eq/kWh]
  [us-4.platform.sh] Charleston, United States (GCP)  [647 gC02eq/kWh]
> us-3.platform.sh

Default branch (--default-branch)
The default Git branch name for the project (the production environment)
Default: main
>

Git repository detected: /Users/nls/psh/remix

Set the new project Remix Deploy as the remote for this repository? [Y/n]
```
Choose a name and a deployment region. The command will automatically set a new git remote on your local repository.

We now have an empty Upsun project ready to be deployed to:
```bash {filename="Terminal"}
The Upsun Bot is activating your project

      ▄     ▄
      ▄█▄▄▄█▄
    ▄██▄███▄██▄
    █ █▀▀▀▀▀█ █
       ▀▀ ▀▀

The project is now ready!
gd33gxlviuaa4

  Region: us-3.platform.sh
  Project ID: gd33gxlviuaa4
  Project title: Remix Deploy
  URL: https://console.upsun.com/01hd1s2bjt44369c0923a70g44/gd33gxlviuaa4
  Git URL: gd33gxlviuaa4@git.us-3.platform.sh:gd33gxlviuaa4.git

Setting the remote project for this repository to: Remix Deploy (gd33gxlviuaa4)
```

We now need a configuration to tell Upsun how to run our project. Fortunately Upsun comes with the `upsun ify` command that will generate most of the YAML configuration automatically.

```text {filename="Terminal"}
upsun ify
Welcome to Upsun!
Let's get started with a few questions.

We need to know a bit more about your project. This will only take a minute!

What language is your project using? We support the following: [JavaScript/Node.js]

✓ Detected dependency managers: Npm
Tell us your project's application name: [remix]

                       (\_/)
We're almost done...  =(^.^)=

Last but not least, unless you're creating a static website, your project uses services. Let's define them:

Select all the services you are using: []

You have not selected any service, would you like to proceed anyway? [Yes]
```
We haven't selected any services here because our data is fully local. If your application need to write some local files, look for the `mounts:` key in the newly created `.upsun/config.yaml`.

## Setting up the Node.js server
As mentionned in the Remix documentation, the default setup does not come with a web server capable of handling incoming requests.
> Remix is not an HTTP server, but rather a handler inside an existing HTTP server. Adapters allow the Remix handler to run inside the HTTP server. Some JavaScript runtimes, especially Node.js, have multiple ways to create an HTTP server. For example, in Node.js you can use Express.js, fastify, or raw http.createServer.

We will go the easy route and use the Remix App Server. It is a basic production-ready node.js Express server made by the Remix team. Good enough for our use-case.

Running it locally is straight-forward:

```bash {filename="Terminal"}
npm run build
npx remix-serve build/index.js

[remix-serve] http://localhost:3000
GET / 200 - - 544.353 ms
```
Let's implement this in our Upsun configuration. As the generated configuration already includes the build command, we just need to specify our start command. Upsun automatically inject the `$HOST` environment variable so you don't need to explicitely add it to the command.
```yaml
    web:
      # Commands are run once after deployment to start the application process.
      # More information: https://docs.upsun.com/create-apps/app-reference.html#web-commands
      commands:
        # The command to launch your app. If it terminates, it's restarted immediately.
        # You can use the $PORT or the $SOCKET environment variable depending on the socket family of your upstream
        start: "npx remix-serve build/index.js"
```
Commit your changes and push your code:
```bash {filename="Terminal"}
git add .upsun
git commit -m "Add Upsun configuration"
upsun push
```

## Deploying to Upsun
The Upsun platform is now fetching the dependencies and building the project. After a couple minutes, our application is now deployed:
```bash {filename="Terminal"}
Creating environment main
        Starting environment
        Updating endpoints for remix
        Opening application remix and its relationships
        Executing deploy hook for application remix

        Opening environment
        Environment configuration
          remix (type: nodejs:20, cpu: 0.5, memory: 224, disk: 512)

        Environment routes
          http://main-bvxea6i-gd33gxlviuaa4.us-3.platformsh.site/ redirects to https://main-bvxea6i-gd33gxlviuaa4.us-3.platformsh.site/
          http://www.main-bvxea6i-gd33gxlviuaa4.us-3.platformsh.site/ redirects to https://www.main-bvxea6i-gd33gxlviuaa4.us-3.platformsh.site/
          https://main-bvxea6i-gd33gxlviuaa4.us-3.platformsh.site/ is served by application `remix`
          https://www.main-bvxea6i-gd33gxlviuaa4.us-3.platformsh.site/ redirects to https://main-bvxea6i-gd33gxlviuaa4.us-3.platformsh.site/

      Blackfire build scheduled
```
You can access the app on the auto-generated URL:

![Remix Application Deployed](/images/deploying-remixjs-app-on-upsun/1_m6HJ6m1JzmAwoDyI9TJ9Hw.webp)

Congratulations! Our app is deployed and working. If you want to add more customization to how requests are handled, the Remix documentation explains how to implement `@remix-run/express`.
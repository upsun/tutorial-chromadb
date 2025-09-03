---
title: The Platform.sh build-and-deploy pipeline
#subtitle: Building and deploying web applications
date: 2017-10-03
image: /images/ng-15320.jpg
#icon: tutorial
featured: false
author:
  - Christopher Skene
sidebar:
  exclude: true
type: post

tags:
  - symfony
  - php
  - golang
  - python
  - ruby
  - node.js
#categories:
#  - engineering
---
{{< callout >}}
A repeatable and consistent build-and-deploy pipeline is an essential part of any modern web application. Platform.sh 
has this philosophy at the heart of its design, tying configuration, code and build artifacts together using Git 
semantics.
{{< /callout >}}

## Build? What Build? This is not C++?!

Part of what explains the huge success of web technologies is the simplicity and low barrier to entry presented by the 
model of dynamic script languages. With Ruby, Python and PHP you could just upload files to a server (and in PHP’s case
you didn’t even need to start a daemon) and&nbsp;it would just work.&nbsp;But that model introduced a number of 
problems...


> “I know PHP! How hard could running an exchange be?” never goes anywhere good.


As David Gerard notes about the 
[Mt. Gox bitcoins exchange heist](https://davidgerard.co.uk/blockchain/2017/09/17/kim-nilsson-of-wizsec-how-the-bitcoins-were-stolen-from-mt-gox/), 
without structure and method bad stuff happens. No serious developer would develop an application these days without 
having some tooling. First and foremost dependency management: you want a consistent process to pull updated versions of 
3rd party libraries that your project uses, with as little friction and effort as possible, so you can quickly apply any
and all security fixes. If you can’t apply security hotfixes as soon as they are out, you are going to get hacked. It’s 
not an “if” question, it is a “when” question. ”When” usually being sooner than you’d like. Without that... well you get 
an Equifax (and you don’t want to be an Equifax).

But often it doesn’t end there. More and more technologies, even dynamic scripty ones, rely on a compile/build phase. 
This is true not only for front-end applications but also for things like NodeJS backends, where TypeScript, 
CoffeeScript and a billion other things transpile into other things.

> Javascript is a compile target not a programming language&mdash; Nick Main ? (@_nickmain) 
> [September 3, 2017](https://twitter.com/_nickmain/status/904451179844845568)

We also see how much compiled languages are gaining traction; languages like Golang (which you can run on Platform.sh 
now too), Crystal, or Elixir.

## In the modern world go Build Or Go Bust!

Build artifacts are components of your web application that are generated when you compile it. While some applications 
have compilation at the heart of their design, many popular web languages eschewed this approach in favour of dynamic 
runtimes&nbsp;and generally only use this approach with external shared components or libraries.

With Platform.sh, you don’t just get a few build artifacts in your project directory, 
[your entire application is an artifact of development](/posts/production-artifact). This artifact is stored and reused 
wherever the same git commit is deployed to a new environment, so simply by using Platform.sh’s standard build tools, 
you get a consistent and repeatable build on every git branch.

Understanding this pipeline and how it works will help you build better web applications on Platform.sh, and is also the
key to knowing how to integrate with other services that you use (as well as when you no longer need them).

## How it works

When you push a new change to Platform.sh, we take your code in Git and move it through a number of steps to turn it 
into a running, “built” application. These steps can be broadly broken down into two phases, the build phase, and the 
deploy phase.

The build process will run the “build flavor” (if present), install dependencies, then run the user-provided build hook.

The deploy process will run the deploy hook.

All these properties are defined in the `.platform.app.yaml` file, and documented in our
[online documentation](https://docs.platform.sh/configuration/app-containers.html), and there’s also a 
[screencast of this build process in action](https://www.youtube.com/watch?v=iHJZIWnv-2s&amp;index=3&amp;list=PLn5EpEMtxTCmNh4eEG52JdxHP6qBV69Ux).

## The Build phase

The Build phase is where we do all the heavy lifting to prepare your 
[application for deployment](https://platform.sh/blog/best-practices-in-deploying-web-apps-updated-for-2020/). It’s where we load external
resources, pack assets, add dependencies and do any tasks which require the filesystem to be writable. During the build
phase, your application can access the network, for example for doing a `composer install` but is not remotely
accessible or available on the internet, and does not have any of its running Services (databases, search indexes) 
attached.

In the build phase we do three things:


* Install any [listed system-level dependencies](https://docs.platform.sh/configuration/app/build.html#build-dependencies).
* For PHP and NodeJS projects, run 
<a href="">[tasks defined for the build flavor](https://docs.platform.sh/configuration/app/build.html#build), for 
example `composer install`. All other project types currently ignore this step.
* Run a build hook, defined in your [build hook in your .platform.app.yaml file](https://docs.platform.sh/configuration/app/build.html#hooks).


The build hook is where you perform steps that require dynamic code generation or file system access, for example:

* Installing dependencies, e.g using npm, yarn, composer, bower, or pip
* Compiling static assets that won’t change, e.g. sass, through gulp or grunt
* Running static code tests, e.g. phpunit


Here's the [build hook from our example Symfony repository](https://github.com/platformsh-templates/symfony3/blob/master/.platform.app.yaml#L19)...

```yaml {filename=".platform.app.yaml"}
hooks:
  build: |
    rm web/app_dev.php
    bin/console --env=prod assets:install --no-debug
```

At the end of the build phase, your application should be completely built and ready to deploy. At this point, it will 
be made read-only.

## The Deploy phase

The deploy phase is run after the application container has been started. You can access other services at this stage 
(database, search service, etc.). The disk where the application lives is read-only at this point. Incoming requests are
paused while the deployment runs.

During the Deploy phase we run only one user-definable step:

* Run a deploy hook, if provided in your [platform.app.yaml file](https://docs.platform.sh/overview/yaml/what-is-yaml.html).

Deploy hooks are where you run commands that prepare your applications services and dynamic assets. For example:

* Clear your caches
* Run database migrations and updates
* Build dynamically generated assets that are stored on file mounts
* Hook into third-party testing tools

Here's the deploy hook from our example Symfony repository...

```yaml {filename=".platform.app.yaml"}
hooks:
  deploy: |

    bin/console --env=prod cache:clear</pre>
```

If everything goes well and your hooks execute correctly, your environment is now moved into place and replaces the 
running environment, and you can see the results of the deploy hook in the `/var/log/deploy.log` file when logged in to 
the environment via SSH. &nbsp;(If everything doesn’t go well, be glad that it was so simple for you to test out this 
deploy process in a development branch before merging into production)

## Summary

With Platform.sh, you get powerful, easy-to-use [WebOps](https://platform.sh/blog/webops/) and 
[continuous deployment](https://platform.sh/blog/what-the-heck-is-ci-cd) tools that allow you to manage complex 
pipelines easily from git commit through to a running environment. &nbsp;The Build and Deploy phases are the key to 
understanding how you can get the maximum value from this pipeline, and where to add your own integrations and code.

In future guides we’ll look at how to integrate with third-party testing tools, how to run tests in the build pipeline, 
and other integrations.

## Further reading

* [Platform.sh Documentation on Build and Deploy Tasks](https://docs.platform.sh/configuration/app/build.html)

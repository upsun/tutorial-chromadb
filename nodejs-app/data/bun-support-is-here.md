---
title: "It's out of the Oven: Bun 1.0 support on Platform.sh"
subtitle: Bun Support is Here
date: 2023-09-08
image: /images/bun_support_blog.png
#icon
featured: false
author:
  - ori-pekelman
sidebar:
  exclude: true
type: post

tags:
  - javascript
  - node.js
#categories
---

Today [Bun](https://bun.sh/) 1.0 is being announced—one of our friends in the ‘**.sh’** tld—so it’s an absolute pleasure
to share a small celebration and our first thoughts on this fully-baked runtime.

For those not in-the know Bun is an all-in-one JavaScript (JS) runtime and toolkit designed for speed; complete with a 
bundler, test runner, and Node.js-compatible package manager. It’s written in Zig which is kind of the “other Rust” and 
one of the cool new compiled languages that is getting some traction—with Bun helping it a lot in gaining legitimacy. 
Bun’s server-side JavaScript ecosystem—of which Deno and Node.js are also a part of, runtimes which Bun has previously 
compared itself to—is hugely active and feels like something new and exciting that we can’t wait to test.

In this article, we’ll take a look at Bun’s origins and what Bun 1.0 has to offer so without further ado, let’s get 
started and cheers to [Jarred-Sumner](https://github.com/Jarred-Sumner), Bun’s author and maintainer, may Bun live 
long and prosper!

## **In the beginning there was Rhino**

Even though Bun certainly feels new and exciting, did you know that server-side JS is actually a quarter century old 
now? It has actually been a thing since 1997\! And as many good things that have happened to the web: it started at 
Mozilla with [Rhino](https://p-bakker.github.io/rhino/history.html). A JavaScript engine I’m all too familiar with.

Back in 2009 I was looking for a way to run some server-side JS for a particular project and after trying to get Rhino 
to work and suffering quite a bit—at the time it was allergic to Java—I then discovered Node.js. And it was awesome.

It was version 0.1.x and even though everything broke with every release—I still remember with unease when `promises` 
were removed—it was still an incredible, liberating experience to work with it. Being able to do cheap concurrency 
without Netty or Erlang, which was exceedingly complex to run at the time, was a lifesaver.

In 2010, I had the pleasure of hosting Ryan Dahl, creator of Node.js, for [a talk in Paris](https://vimeo.com/13264164) 
and I was enamored with his vision. This was a serious network developer that was used to writing high-performance 
network daemons in C and his approach was nothing if not revolutionary. It was all about simple concurrency, not 
tight-loop multi-core performance, sometimes simple abstractions win. And now Bun, in a way, is returning to these roots
and asking why can’t we have both with Bun 1.0?

**The results from testing Bun 1.0**

I tested out and compared Yarn and Bun 1.0 with a small project, and generated the following figures:

* Yarn install: first run: 2458 packages installed [**209.15s**]
* Yarn install: second run: 2458 packages installed [**161.90s**]
* Yarn install: third run: 2458 packages installed [**62.90s**]
* Bun install: first run: 2458 packages installed [**71.53s**]
* Bun install: second run : 2458 packages installed [**37.65s**]
* Bun install: third run : 2458 packages installed [**14.64s**]

So it seems that **Bun 1.0 is 3x faster than Yarn, and even more with caching**. Sweet!

### **Where to host Bun?**

You can host your Bun application on Platform.sh at Bun 1.0 as our Node.js images now carry it—no install needed. In 
your `.platform.app.yaml` simply:

```yaml {filename=".platform.app.yaml"}
# choose nodejs version 20 or above
    type: 'nodejs:20'
    # override the default nodejs build flavor
    build:
    	flavor: none
    # use bun to install the dependencies
    hooks:
    	build: bun install
    # In the start command replace node with bun
    web:
    	commands:
    		start:'bun app.js'
```

Copy the snippet  
And that’s it, happy testing everyone!
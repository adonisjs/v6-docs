# Introduction

Welcome to the AdonisJS tutorial for new comers. The purpose of this tutorial is to teach you how to create end to end web applications from scratch using AdonisJS.

Throughout this tutorial, we will choose simple tools and techniques to build a hacker news clone. Simple is not bad, in fact it should be the norm in the world full of complex acronyms and libraries releasing every week.

## The tech stack

- [**Edge.js**]() is a server rendered template engine for Node.js. It requires zero build tools and is a great fit for creating web applications with limited frontend interactivity.
- [**Tailwind CSS**](https://tailwindcss.com) is a utility-first CSS framework. We will be using it to style our web application.
- [**Unpoly**](https://unpoly.com) progressively enhances existing web applications without writing any custom frontend JavaScript. We will be using it to have SPA style navigation and perform partial page updates.
- [**Vite**]() is a build system for frontend applications. We will be using it to compile TailwindCSS. Even though, we can compile TailwindCSS using its CLI, We think it will be worth learning how to setup Vite inside an AdonisJS application for your future projects.

## Pre-requisites

We expect the readers of this tutorial to have basic understanding of JavaScript/TypeScript, HTML, CSS and might have some experience in creating Node.js applications.

Since, this tutorial focuses on learning the framework (AdonisJS), we will not be discussing the basics of JavaScript or Node.js here. If you are new to programming and want to learn Node.js, then please visit [nodejs.dev](https://nodejs.dev/en/learn/).

Before getting started, make sure you have Node.js and npm installed on your computer. AdonisJS requires `Node.js >= 18`. You can install Node.js from the [official website](https://nodejs.org/en/download/), it should only take a few minutes.

```sh
# Verify Node.js version
node -v
# v18.11.0

# Verify npm version
npm -v
# 8.19.2
```

## Editor setup

You can use any code editor of your choice as long as it has support for TypeScript. If you were to ask us, we will recommend using [VSCode](https://code.visualstudio.com) with the following extensions for a great development experience.

- [AdonisJS VSCode extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.adonis-vscode-extension)
- [Japa VSCode extension](https://marketplace.visualstudio.com/items?itemName=jripouteau.japa-vscode)
- [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier code formatter extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
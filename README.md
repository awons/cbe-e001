# Setting up LinkedIn as an identity provider for Cognito User Pool with help of Auth0

This application is part a tutorial you can find here:
* YouTube - https://....
* Blog - https://cloudbyexampl.io/....

## Using dev container in vscode
This repository contains a `.devcontainer` configuation for VSCode. Just repopen this repo in that container and you are ready to go. It maps to port 8080 on the host.

## Backed app requirements
* node 12.x
* nodemon

## Setup application
Install dependencies with:
```bash
npm install
```

Copy `.env.dist` to `.env` and set up all required values.

To start run:
```bash
nodemon app.js
```

## Create respources with CloudFormation
I assume you already have AWS CLI installed and configured.

```bash
aws cloudformation create-stack \
    --stack-name linkedin-auth0-integration \
    --template-body file://cloudformation/template.yml \
    --parameters file://cloudformation/parameters.json \
    --capabilities CAPABILITY_NAMED_IAM
```

FROM node:slim

LABEL com.github.actions.name="GitHub Action: Workflow Run Wait" \
      com.github.actions.description="wait for all `workflow_run` required workflows to be successful" \
      com.github.actions.icon="clock" \
      com.github.actions.color="blue" \
      maintainer="Taner <renatsylr@gmail.com>"

RUN mkdir /action
WORKDIR /action

COPY action ./

RUN npm ci --only=prod

ENTRYPOINT ["node", "/action/index.js"]

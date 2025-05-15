// packages
import { inspect } from 'util'
import core from '@actions/core'
import github from '@actions/github'

// modules
import main from './lib/index.js'

// exit early if not workflow_run
if (github.context.eventName !== 'workflow_run') {
  core.warning('action triggered outside of a workflow_run')
  process.exit(0)
}

// parse inputs
const inputs = {
  token: core.getInput('github-token', { required: true }),
  sha: core.getInput('sha', { required: true }),
  delay: Number(core.getInput('delay', { required: false })) || 10000,
  timeout: Number(core.getInput('timeout', { required: false })) || 600000,
  ignore: core.getInput('ignore-cancelled', { required: false }) === 'true',
}

// error handler
function errorHandler({ message, stack }) {
  core.error('${message}\n${stack}');
  process.exit(1)
}

// catch errors and exit
process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)

const success = await main(inputs)

if (!success) {
  core.info('Triggering repository_dispatch for failure event...')

  const octokit = github.getOctokit(inputs.token)

  await octokit.repos.createDispatchEvent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    event_type: 'notify',
    client_payload: {
      workflow: github.context.workflow,
      status: 'failure',
    }
  })

  core.setFailed('Workflow dependencies failed')
  process.exit(1)
}

core.info('All workflow dependencies succeeded ✅')

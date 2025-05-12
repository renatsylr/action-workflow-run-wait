// packages
import { inspect } from 'util'
import core from '@actions/core'
import github from '@actions/github'
import axios from 'axios'

// modules
import main from './lib/index.js'

// exit early
if (github.context.eventName !== 'workflow_run') {
  core.warning('action triggered outside of a workflow_run')
  process.exit(0)
}

// parse inputs
const inputs = {
  token: core.getInput('github-token', { required: true }),
  sha: core.getInput('sha', { required: true }),
  delay: Number(core.getInput('delay', { required: false })),
  timeout: Number(core.getInput('timeout', { required: false })),
  ignore: core.getInput('ignore-cancelled', { required: false }) === 'true',
}

// error handler
function errorHandler({ message, stack }) {
  core.error(${message}\n${stack})
  process.exit(1)
}

process.on('unhandledRejection', errorHandler)
process.on('uncaughtException', errorHandler)

try {
  const result = await main(inputs)

  if (result !== 'success') {
    await triggerFailureNotification(
      inputs.token,
      github.context.repo.owner,
      github.context.repo.repo,
      github.context.workflow,
      result
    )
    core.setFailed(❌ Workflow failed with conclusion: ${result})
  }
} catch (error) {
  core.setFailed(error.message)
  await triggerFailureNotification(
    inputs.token,
    github.context.repo.owner,
    github.context.repo.repo,
    github.context.workflow,
    'failure'
  )
}

// ✅ dispatch trigger function
async function triggerFailureNotification(token, owner, repo, workflowName, conclusion) {
  try {
    const url = https://api.github.com/repos/${owner}/${repo}/dispatches
    await axios.post(
      url,
      {
        event_type: 'notify',
        client_payload: {
          workflow: workflowName,
          status: conclusion,
        },
      },
      {
        headers: {
          Authorization: Bearer ${token},
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    console.log(📣 repository_dispatch triggered for '${workflowName}' with status '${conclusion}')
  } catch (err) {
    console.warn(⚠️ Failed to dispatch notify event: ${err.message})
  }
}

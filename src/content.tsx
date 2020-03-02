import { Gitako } from 'components/Gitako'
import { isGithub } from "./utils/GitHubHelper"
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import './content.less'

function init() {

  if (isGithub()) { // with github icon
    const SideBarElement = document.createElement('div')
    document.body.appendChild(SideBarElement)
    ReactDOM.render(<Gitako />, SideBarElement)
  }

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

/**
 * this helper helps manipulating DOM
 */
import { Clippy, ClippyClassName } from 'components/Clippy'
import { CopyFileButton, copyFileButtonClassName } from 'components/CopyFileButton'
import * as NProgress from 'nprogress'
import * as PJAX from 'pjax'
import * as React from 'react'
import { renderReact } from './general'

NProgress.configure({ showSpinner: false })

/**
 * when gitako is ready, make page's header narrower
 * or cancel it
 */
export function markGitakoReadyState(ready: boolean) {
  const readyClassName = 'gitako-ready'
  const classList = document.body.classList
  if (ready) classList.add(readyClassName)
  else classList.remove(readyClassName)
}

/**
 * if should show gitako, then move body right to make space for showing gitako
 * otherwise, hide the space
 */
export const bodySpacingClassName = 'with-gitako-spacing'
export function setBodyIndent(shouldShowGitako: boolean) {
  if (shouldShowGitako) {
    document.body.classList.add(bodySpacingClassName)
  } else {
    document.body.classList.remove(bodySpacingClassName)
  }
}

function $<EE extends Element, E extends (element: EE) => any, O extends () => any>(
  selector: string,
  existCallback?: E,
  otherwise?: O,
): E extends never
  ? O extends never
  ? Element | null
  : ReturnType<O> | null
  : O extends never
  ? ReturnType<E> | null
  : ReturnType<O> | ReturnType<E> {
  const element = document.querySelector(selector)
  if (element) {
    return existCallback ? existCallback(element as EE) : element
  }
  return otherwise ? otherwise() : null
}

export function isInCodePage() {
  const branchListSelector = '#branch-select-menu.branch-select-menu'
  return Boolean($(branchListSelector))
}

export function getBranches() {
  const branchSelector = '.branch-select-menu .select-menu-list > div .select-menu-item-text'
  const branchElements = Array.from(document.querySelectorAll(branchSelector))
  return branchElements.map(element => element.innerHTML.trim())
}

export function getCurrentBranch() {
  const selectedBranchButtonSelector = '.repository-content .branch-select-menu summary'
  const branchButtonElement: HTMLElement = $(selectedBranchButtonSelector)
  if (branchButtonElement) {
    const branchNameSpanElement = branchButtonElement.querySelector('span')
    if (branchNameSpanElement) {
      const partialBranchNameFromInnerText = branchNameSpanElement.innerText
      if (!partialBranchNameFromInnerText.includes('…')) return partialBranchNameFromInnerText
    }
    const defaultTitle = 'Switch branches or tags'
    const title = branchButtonElement.title.trim()
    if (title !== defaultTitle && !title.includes(' ')) return title
  }

  const findFileButtonSelector =
    '#js-repo-pjax-container .repository-content .file-navigation a[data-hotkey="t"]'
  const urlFromFindFileButton: string | undefined = $(
    findFileButtonSelector,
    element => (element as HTMLAnchorElement).href,
  )
  if (urlFromFindFileButton) {
    const commitPathRegex = /^(.*?)\/(.*?)\/find\/(.*?)$/
    const result = urlFromFindFileButton.match(commitPathRegex)
    if (result) {
      const [_, userName, repoName, branchName] = result
      if (!branchName.includes(' ')) return branchName
    }
  }

}

/**
 * add the logo element into DOM
 */
export function insertLogoMountPoint() {
  const logoSelector = '.gitako .gitako-logo'
  return $(logoSelector) || createLogoMountPoint()
}

function createLogoMountPoint() {
  const logoMountElement = document.createElement('div')
  logoMountElement.classList.add('gitako-logo-mount-point')
  document.body.appendChild(logoMountElement)
  return logoMountElement
}

/**
 * content above the file navigation bar is same for all pages of the repo
 * use this function to scroll down a bit to hide them
 */
export function scrollToRepoContent() {
  const repositoryContentSelector = '.repository-content'
  // do NOT use behavior: smooth here as it will scroll horizontally
  $(repositoryContentSelector, repositoryContentElement =>
    repositoryContentElement.scrollIntoView(),
  )
}

const pjax = new PJAX({
  elements: 'match-nothing-selector',
  selectors: [
    '.repository-content',
    'title',
    '[data-pjax="#js-repo-pjax-container"]',
    '.page-content',
  ],
  scrollTo: false,
  analytics: false,
  cacheBust: false,
  forceCache: true, // TODO: merge namespace, add forceCache
})

// Note: shall not enable below pjax:send listener as there would be dual bar when GitHub PJAX links are triggered
// window.addEventListener('pjax:send', () => mountTopProgressBar())
window.addEventListener('pjax:complete', () => unmountTopProgressBar())

export function loadWithPJAX(URL: string) {
  mountTopProgressBar()
  pjax.loadUrl(URL, { scrollTo: 0 })
}

/**
 * there are few types of pages on GitHub, mainly
 * 1. raw text: code
 * 2. rendered content: like Markdown
 * 3. preview: like image
 */
const PAGE_TYPES = {
  RAW_TEXT: 'raw_text',
  RENDERED: 'rendered',
  SEARCH: 'search',
  // PREVIEW: 'preview',
  OTHERS: 'others',
}

/**
 * this function tries to tell which type current page is of
 *
 * note: not determining through file extension here
 * because there might be files using wrong extension name
 *
 * TODO: distinguish type 'preview'
 */
export function getCurrentPageType() {
  const blobPathSelector = '#blob-path' // path next to branch switcher
  const blobWrapperSelector = '.repository-content .blob-wrapper table'
  const readmeSelector = '.repository-content .readme'
  const searchResultSelector = '.codesearch-results'
  return (
    $(searchResultSelector, () => PAGE_TYPES.SEARCH) ||
    $(blobWrapperSelector, () => $(blobPathSelector, () => PAGE_TYPES.RAW_TEXT)) ||
    $(readmeSelector, () => PAGE_TYPES.RENDERED) ||
    PAGE_TYPES.OTHERS
  )
}

export const REPO_TYPE_PRIVATE = 'private'
export const REPO_TYPE_PUBLIC = 'public'
export function getRepoPageType() {
  const headerSelector = `#js-repo-pjax-container .pagehead.repohead h1`
  return $(headerSelector, header => {
    const repoPageTypes = [REPO_TYPE_PRIVATE, REPO_TYPE_PUBLIC]
    for (const repoPageType of repoPageTypes) {
      if (header.classList.contains(repoPageType)) {
        return repoPageType
      }
    }
  })
}

/**
 * get text content of raw text content
 */
export function getCodeElement() {
  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    const codeContentSelector = '.repository-content .data table'
    const codeContentElement = $(codeContentSelector)
    if (!codeContentElement) {
      // raise error
    }
    return codeContentElement
  }
}

/**
 * add copy file content buttons to button groups
 * click these buttons will copy file content to clipboard
 */
export function attachCopyFileBtn() {
  if (getCurrentPageType() === PAGE_TYPES.RAW_TEXT) {
    // the button group in file content header
    const buttonGroupSelector = '.repository-content > .Box > .Box-header .BtnGroup'
    const buttonGroups = document.querySelectorAll(buttonGroupSelector)

    if (buttonGroups.length === 0) {
      // raise error
    }

    buttonGroups.forEach(async buttonGroup => {
      if (!buttonGroup.lastElementChild) return
      const button = await renderReact(React.createElement(CopyFileButton))
      if (button instanceof HTMLElement) {
        buttonGroup.appendChild(button)
      }
    })
    return () => {
      const buttons = document.querySelectorAll(`.${copyFileButtonClassName}`)
      buttons.forEach(button => {
        button.parentElement?.removeChild(button)
      })
    }
  }
}

/**
 * copy content of a DOM element to clipboard
 */
export function copyElementContent(element: Element): boolean {
  let selection = window.getSelection()
  if (selection) selection.removeAllRanges()
  const range = document.createRange()
  range.selectNode(element)
  selection = window.getSelection()
  if (selection) selection.addRange(range)
  const isCopySuccessful = document.execCommand('copy')
  selection = window.getSelection()
  if (selection) selection.removeAllRanges()
  return isCopySuccessful
}

export function attachCopySnippet() {
  const readmeSelector = '.repository-content div#readme'
  return $(readmeSelector, () => {
    const readmeArticleSelector = '.repository-content div#readme article'
    return $(
      readmeArticleSelector,
      readmeElement => {
        const mouseOverCallback = async ({ target }: Event): Promise<void> => {
          if (target instanceof Element && target.nodeName === 'PRE') {
            if (
              target.previousSibling === null ||
              !(target.previousSibling instanceof Element) ||
              !target.previousSibling.classList.contains(ClippyClassName)
            ) {
              /**
               *  <article>
               *    <pre></pre>     <!-- case A -->
               *    <div class="highlight">
               *      <pre></pre>   <!-- case B -->
               *    </div>
               *  </article>
               */
              if (target.parentNode) {
                const clippyElement = await renderReact(
                  React.createElement(Clippy, { codeSnippetElement: target }),
                )
                if (clippyElement instanceof HTMLElement) {
                  target.parentNode.insertBefore(clippyElement, target)
                }
              }
            }
          }
        }
        readmeElement.addEventListener('mouseover', mouseOverCallback)
        return () => {
          readmeElement.removeEventListener('mouseover', mouseOverCallback)
          const buttons = document.querySelectorAll(`.${ClippyClassName}`)
          buttons.forEach(button => {
            button.parentElement?.removeChild(button)
          })
        }
      },
      () => {
        const plainReadmeSelector = '.repository-content div#readme .plain'
        // raise error
      },
    )
  })
}

/**
 * focus to side bar, user will be able to manipulate it with keyboard
 */
export function focusFileExplorer() {
  const sideBarContentSelector = '.gitako-side-bar .file-explorer'
  $(sideBarContentSelector, sideBarElement => {
    if (sideBarElement instanceof HTMLElement) sideBarElement.focus()
  })
}

export function focusSearchInput() {
  const searchInputSelector = '.search-input'
  $(searchInputSelector, searchInputElement => {
    if (
      document.activeElement !== searchInputElement &&
      searchInputElement instanceof HTMLElement
    ) {
      searchInputElement.focus()
    }
  })
}

export function mountTopProgressBar() {
  NProgress.start()
}

export function unmountTopProgressBar() {
  NProgress.done()
}

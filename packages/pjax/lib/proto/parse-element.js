var attrState = "data-pjax-state"

module.exports = function(el) {
  switch (el.tagName.toLowerCase()) {
    case "a":
      // only attach link if el does not already have link attached
      if (!el.hasAttribute(attrState)) {
        this.attachLink(el)
      }
      break

    case "form":
      break

    default:
      throw "Pjax can only be applied on <a> or <form> submit"
  }
}

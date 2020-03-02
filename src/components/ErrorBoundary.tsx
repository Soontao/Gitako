import * as React from 'react'

export class ErrorBoundary extends React.PureComponent {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // raise error
  }

  render() {
    return this.props.children
  }
}

import { Component } from 'react';

/**
 * Error boundary: if ANY child section throws during render,
 * catch it and render a fallback instead of unmounting the whole
 * React tree (which produced the black screen). This keeps the
 * rest of the site alive even if one feature breaks.
 */
export default class SectionBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, info) {
    // keep the page alive; log for debugging
    if (typeof console !== 'undefined') {
      console.error('[SectionBoundary] captured error:', error);
    }
  }
  render() {
    if (this.state.failed) return this.props.fallback || null;
    return this.props.children;
  }
}
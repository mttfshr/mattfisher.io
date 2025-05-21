
// This is a simple test component to diagnose module loading issues
export default {
  name: 'TestComponent',
  data() {
    return {
      message: 'If you can see this message, module loading is working!'
    }
  },
  template: `<div class="test-component">{{ message }}</div>`
}

// Global error handler for debugging DOM issues
console.log('🚀 Debug script loaded');

// Override appendChild to catch null reference errors
const originalAppendChild = Node.prototype.appendChild;
Node.prototype.appendChild = function(child) {
  if (!this) {
    console.error('❌ appendChild called on null/undefined node:', {
      node: this,
      child: child,
      stack: new Error().stack
    });
    throw new Error('Cannot appendChild to null node');
  }
  return originalAppendChild.call(this, child);
};

// Override document.body access
Object.defineProperty(document, 'body', {
  get: function() {
    const body = document.getElementsByTagName('body')[0];
    if (!body) {
      console.warn('⚠️ document.body accessed but body element not found');
    }
    return body;
  },
  configurable: true
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
});

console.log('✅ Debug overrides installed');

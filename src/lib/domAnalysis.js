// DOM analysis utilities for debugging hydration mismatches
import { browser } from '$app/environment';

/**
 * Analyze DOM structure and identify potential hydration issues
 */
export function analyzeDOMStructure() {
  if (!browser) return null;
  
  console.log('[DOM ANALYSIS] Starting comprehensive DOM analysis...');
  
  const analysis = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    readyState: document.readyState,
    body: {
      exists: !!document.body,
      children: document.body?.children?.length || 0,
      innerHTML: document.body?.innerHTML?.length || 0
    },
    head: {
      exists: !!document.head,
      children: document.head?.children?.length || 0
    },
    scripts: [],
    errors: [],
    suspicious: []
  };
  
  // Analyze all script tags
  const scripts = document.querySelectorAll('script');
  scripts.forEach((script, i) => {
    analysis.scripts.push({
      index: i,
      src: script.src || 'inline',
      type: script.type || 'text/javascript',
      async: script.async,
      defer: script.defer,
      hasContent: script.textContent?.length > 0
    });
  });
  
  // Look for suspicious elements that might cause hydration issues
  const allElements = document.querySelectorAll('*');
  let suspiciousCount = 0;
  
  allElements.forEach((el, i) => {
    try {
      // Check for elements without proper tagName
      if (!el.tagName) {
        analysis.suspicious.push({
          index: i,
          issue: 'Missing tagName',
          element: el.toString()
        });
        suspiciousCount++;
      }
      
      // Check for elements with unusual attributes
      if (el.attributes) {
        for (let attr of el.attributes) {
          if (!attr.name || attr.name.includes('undefined')) {
            analysis.suspicious.push({
              index: i,
              issue: 'Undefined attribute',
              tagName: el.tagName,
              attribute: attr.name
            });
            suspiciousCount++;
          }
        }
      }
      
      // Check for text nodes with unexpected content
      if (el.childNodes) {
        el.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes('undefined')) {
            analysis.suspicious.push({
              index: i,
              issue: 'Text contains undefined',
              tagName: el.tagName,
              textContent: node.textContent?.substring(0, 100)
            });
            suspiciousCount++;
          }
        });
      }
      
    } catch (error) {
      analysis.errors.push({
        index: i,
        error: error.message,
        tagName: el?.tagName || 'unknown'
      });
    }
  });
  
  analysis.summary = {
    totalElements: allElements.length,
    suspiciousElements: suspiciousCount,
    errorElements: analysis.errors.length,
    totalScripts: analysis.scripts.length
  };
  
  console.log('[DOM ANALYSIS] Analysis complete:', analysis.summary);
  
  if (suspiciousCount > 0) {
    console.warn('[DOM ANALYSIS] Found suspicious elements:', analysis.suspicious);
  }
  
  if (analysis.errors.length > 0) {
    console.error('[DOM ANALYSIS] Found element errors:', analysis.errors);
  }
  
  return analysis;
}

/**
 * Compare DOM state between two snapshots
 */
export function compareDOMSnapshots(snapshot1, snapshot2) {
  if (!browser || !snapshot1 || !snapshot2) return null;
  
  const comparison = {
    timestamp: new Date().toISOString(),
    differences: []
  };
  
  // Compare basic metrics
  if (snapshot1.body.children !== snapshot2.body.children) {
    comparison.differences.push({
      type: 'body-children-count',
      before: snapshot1.body.children,
      after: snapshot2.body.children
    });
  }
  
  if (snapshot1.summary.totalElements !== snapshot2.summary.totalElements) {
    comparison.differences.push({
      type: 'total-elements',
      before: snapshot1.summary.totalElements,
      after: snapshot2.summary.totalElements
    });
  }
  
  if (snapshot1.scripts.length !== snapshot2.scripts.length) {
    comparison.differences.push({
      type: 'script-count',
      before: snapshot1.scripts.length,
      after: snapshot2.scripts.length
    });
  }
  
  console.log('[DOM ANALYSIS] Comparison complete:', comparison);
  return comparison;
}

/**
 * Monitor DOM changes in real-time
 */
export function setupDOMMonitoring(duration = 30000) {
  if (!browser) return null;
  
  console.log(`[DOM ANALYSIS] Setting up DOM monitoring for ${duration}ms...`);
  
  const changes = [];
  let changeCount = 0;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      changeCount++;
      
      const change = {
        timestamp: Date.now(),
        type: mutation.type,
        target: mutation.target?.tagName || 'unknown',
        addedNodes: mutation.addedNodes?.length || 0,
        removedNodes: mutation.removedNodes?.length || 0
      };
      
      changes.push(change);
      
      // Log significant changes
      if (mutation.addedNodes?.length > 0 || mutation.removedNodes?.length > 0) {
        console.log(`[DOM ANALYSIS] DOM change #${changeCount}:`, change);
      }
      
      // If we're seeing the target error pattern, log extra detail
      if (mutation.target?.tagName && (
          mutation.removedNodes?.length > 0 || 
          mutation.addedNodes?.length > 0
      )) {
        console.log(`[DOM ANALYSIS] Significant change in ${mutation.target.tagName}:`, {
          added: Array.from(mutation.addedNodes || []).map(n => n.tagName || n.nodeType),
          removed: Array.from(mutation.removedNodes || []).map(n => n.tagName || n.nodeType)
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    characterData: true,
    characterDataOldValue: true
  });
  
  // Stop after duration
  setTimeout(() => {
    observer.disconnect();
    console.log(`[DOM ANALYSIS] DOM monitoring stopped after ${duration}ms. Total changes: ${changeCount}`);
    
    if (changes.length > 100) {
      console.warn('[DOM ANALYSIS] High number of DOM changes detected:', changes.length);
      console.log('[DOM ANALYSIS] First 10 changes:', changes.slice(0, 10));
      console.log('[DOM ANALYSIS] Last 10 changes:', changes.slice(-10));
    } else {
      console.log('[DOM ANALYSIS] All changes:', changes);
    }
  }, duration);
  
  return {
    stop: () => observer.disconnect(),
    getChanges: () => changes
  };
}
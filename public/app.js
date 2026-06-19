// Telemetry & Control variables
let gatewayOnline = true;
let apNodeOnline = true;
let baseRequests = 3450;
let requestCountEl = document.getElementById('req-count');
let latencyEl = document.getElementById('latency-ms');
let terminalOutput = document.getElementById('terminal-output');
let terminalInput = document.getElementById('terminal-input');
let toggleGatewayBtn = document.getElementById('toggle-gateway-btn');
let injectTrafficBtn = document.getElementById('trigger-traffic-btn');

// Initialize stats
updateRequestsDisplay();

// Periodically update active request counts and latency slightly to make it feel alive
setInterval(() => {
  if (gatewayOnline) {
    let dev = Math.floor(Math.random() * 200) - 100;
    let multiplier = apNodeOnline ? 1.0 : 0.7; // Lower traffic cap if a node is down
    let currentReqs = Math.floor((baseRequests + dev) * multiplier);
    
    requestCountEl.textContent = currentReqs.toLocaleString();
    
    // Slight latency jitter
    let latency = (0.7 + Math.random() * 0.3).toFixed(2);
    latencyEl.textContent = `${latency}ms`;
    
    // Update progress bars slightly
    updateNodeCpuLoads();
  }
}, 2000);

function updateRequestsDisplay() {
  if (gatewayOnline) {
    requestCountEl.textContent = baseRequests.toLocaleString();
    latencyEl.textContent = "0.85ms";
  } else {
    requestCountEl.textContent = "0";
    latencyEl.textContent = "—";
  }
}

function updateNodeCpuLoads() {
  const connClasses = document.querySelectorAll('.val-conn');
  connClasses.forEach((el, index) => {
    if (el.id === 'ap-conn' && !apNodeOnline) return;
    
    let currentVal = parseInt(el.textContent.replace(/,/g, ''));
    let jitter = Math.floor(Math.random() * 80) - 40;
    let newVal = Math.max(100, currentVal + jitter);
    el.textContent = newVal.toLocaleString();
  });
}

// Toggle overall Gateway Status
toggleGatewayBtn.addEventListener('click', () => {
  gatewayOnline = !gatewayOnline;
  
  const statusLabel = document.querySelector('.status-label');
  const pulseIndicator = document.querySelector('.pulse-indicator');
  
  if (gatewayOnline) {
    statusLabel.textContent = "GATEWAY ONLINE";
    statusLabel.parentElement.style.borderColor = "rgba(0, 255, 135, 0.2)";
    statusLabel.parentElement.style.color = "var(--accent-green)";
    statusLabel.parentElement.style.background = "rgba(0, 255, 135, 0.08)";
    pulseIndicator.style.backgroundColor = "var(--accent-green)";
    toggleGatewayBtn.innerHTML = '<span class="btn-icon">🔌</span> Toggle Gateway Status';
    
    writeToTerminal("Initializing Nginx worker processes...", "t-cyan");
    writeToTerminal("Loading configuration file: /etc/nginx/nginx.conf ... success", "t-success");
    writeToTerminal("Listening on port 80 & 443. Traffic routing enabled.", "t-success");
    updateRequestsDisplay();
  } else {
    statusLabel.textContent = "GATEWAY OFFLINE";
    statusLabel.parentElement.style.borderColor = "rgba(255, 71, 87, 0.2)";
    statusLabel.parentElement.style.color = "var(--accent-red)";
    statusLabel.parentElement.style.background = "rgba(255, 71, 87, 0.08)";
    pulseIndicator.style.backgroundColor = "var(--accent-red)";
    toggleGatewayBtn.innerHTML = '<span class="btn-icon">⚡</span> Enable Gateway Status';
    
    writeToTerminal("Stopping Nginx worker processes gracefully...", "t-yellow");
    writeToTerminal("Gateway shut down. Upstream connections closed.", "t-red");
    updateRequestsDisplay();
  }
});

// Inject test traffic
injectTrafficBtn.addEventListener('click', () => {
  if (!gatewayOnline) {
    writeToTerminal("Error: Cannot inject traffic when Gateway is offline.", "t-red");
    return;
  }
  
  writeToTerminal("Injecting packet burst: 1,000 synthetic HTTP request payloads...", "t-cyan");
  
  let i = 0;
  const burstInterval = setInterval(() => {
    if (i >= 5) {
      clearInterval(burstInterval);
      writeToTerminal("Traffic injection completed. Rate limiting policies checked.", "t-success");
      return;
    }
    
    let path = ['/api/v1/users', '/api/v1/auth/login', '/products/list', '/static/hero.png', '/api/v2/telemetry'][Math.floor(Math.random() * 5)];
    let ip = `192.168.10.${Math.floor(Math.random() * 254) + 1}`;
    let status = [200, 200, 200, 304, 404, 201][Math.floor(Math.random() * 6)];
    writeToTerminal(`GET ${path} from ${ip} - Status: ${status} (1.12ms)`, status === 404 ? 't-red' : 't-success');
    
    // Temporarily spike request numbers
    baseRequests += 200;
    setTimeout(() => { baseRequests -= 200; }, 4000);
    
    i++;
  }, 150);
});

// Shutdown AP-South proxy node
window.toggleApNode = function() {
  if (!gatewayOnline) {
    writeToTerminal("Error: Cannot configure nodes while gateway is offline.", "t-red");
    return;
  }

  apNodeOnline = !apNodeOnline;
  
  const apBadge = document.getElementById('ap-badge');
  const apCpuFill = document.getElementById('ap-cpu-fill');
  const apConn = document.getElementById('ap-conn');
  const apBandwidth = document.getElementById('ap-bandwidth');
  const btn = document.querySelector('#node-ap-south .node-btn');
  
  if (apNodeOnline) {
    apBadge.textContent = "ACTIVE";
    apBadge.className = "node-badge badge-active";
    apCpuFill.style.width = "61%";
    apConn.textContent = "4,120";
    apBandwidth.textContent = "910 MB/s";
    btn.textContent = "Shutdown Node";
    btn.style.color = "var(--text-secondary)";
    btn.style.borderColor = "var(--border-color)";
    btn.style.background = "rgba(255, 255, 255, 0.03)";
    
    writeToTerminal("Upstream Node 'AP-South' (10.0.3.89:8080) attached to routing table.", "t-success");
  } else {
    apBadge.textContent = "OFFLINE";
    apBadge.className = "node-badge badge-offline";
    apCpuFill.style.width = "0%";
    apConn.textContent = "0";
    apBandwidth.textContent = "0 MB/s";
    btn.textContent = "Restart Node";
    btn.style.color = "var(--accent-green)";
    btn.style.borderColor = "rgba(0, 255, 135, 0.3)";
    btn.style.background = "rgba(0, 255, 135, 0.05)";
    
    writeToTerminal("CRITICAL: Upstream Node 'AP-South' (10.0.3.89:8080) went offline. Re-routing traffic.", "t-red");
  }
};

// Help helper
function writeToTerminal(text, className = '') {
  let line = document.createElement('div');
  line.className = 'terminal-line' + (className ? ' ' + className : '');
  
  if (className === 't-prompt') {
    line.innerHTML = text;
  } else {
    line.textContent = text;
  }
  
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Terminal Commands Logic
terminalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    let rawCmd = terminalInput.value.trim();
    terminalInput.value = '';
    
    if (!rawCmd) return;
    
    writeToTerminal(`<span class="t-prompt">[guest@nginx-nana]$</span> ${rawCmd}`, 't-prompt');
    
    let cmd = rawCmd.toLowerCase();
    
    switch (cmd) {
      case 'help':
        writeToTerminal("Available commands:", "t-yellow");
        writeToTerminal("  status   - View current Gateway operational status & loads", "t-yellow");
        writeToTerminal("  nodes    - List connected proxy node health parameters", "t-yellow");
        writeToTerminal("  inject   - Trigger load balancing request stress tests", "t-yellow");
        writeToTerminal("  toggle   - Shut down or startup the primary Nginx proxy", "t-yellow");
        writeToTerminal("  clear    - Clear console output window log history", "t-yellow");
        break;
      
      case 'clear':
        terminalOutput.innerHTML = '';
        break;
        
      case 'status':
        writeToTerminal(`Gateway Operational: ${gatewayOnline ? "YES" : "NO"}`, gatewayOnline ? "t-success" : "t-red");
        writeToTerminal(`Active Client Connections: ${requestCountEl.textContent}`);
        writeToTerminal(`Average Service Latency: ${latencyEl.textContent}`);
        writeToTerminal(`Routing Mode: Round Robin (Weighted)`);
        break;
        
      case 'nodes':
        writeToTerminal("Upstream Server Pool Summary:", "t-cyan");
        writeToTerminal(" - US-East (10.0.1.15) : Status ACTIVE / Weight 3 / Load 42%");
        writeToTerminal(" - EU-West (10.0.2.22) : Status ACTIVE / Weight 2 / Load 28%");
        writeToTerminal(` - AP-South (10.0.3.89) : Status ${apNodeOnline ? "ACTIVE" : "OFFLINE"} / Weight 4 / Load ${apNodeOnline ? "61%" : "0%"}`);
        break;
        
      case 'inject':
        injectTrafficBtn.click();
        break;
        
      case 'toggle':
        toggleGatewayBtn.click();
        break;
        
      default:
        writeToTerminal(`bash: command not found: ${rawCmd}. Type 'help' for options.`, "t-red");
    }
  }
});

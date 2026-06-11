document.addEventListener('DOMContentLoaded', async () => {
  const ordersList = document.querySelector('.orders-list');
  const activeOrdersTitle = document.querySelector('.section-title');

  // Map status string to UI text and progress index
  const statusConfig = {
    'queued': { text: 'Placed', icon: 'fa-check', badgeClass: 'placed', index: 1 },
    'in_progress': { text: 'In Kitchen', icon: 'fa-clock', badgeClass: 'in-kitchen', index: 2 },
    'ready': { text: 'Ready', icon: 'fa-check-circle', badgeClass: 'ready', index: 3 },
    'served': { text: 'Served', icon: 'fa-utensils', badgeClass: 'served', index: 4 },
    'cancelled': { text: 'Cancelled', icon: 'fa-times-circle', badgeClass: 'cancelled', index: 0 }
  };

  async function fetchOrders() {
    try {
      ordersList.innerHTML = '<p style="color: #fff; text-align: center;">Loading orders...</p>';
      const response = await fetch('../api/get_customer_orders.php');
      
      if (response.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const orders = await response.json();
      renderOrders(orders);
    } catch (error) {
      console.error(error);
      ordersList.innerHTML = '<p style="color: #ef4444; text-align: center;">Error loading orders.</p>';
    }
  }

  function renderOrders(orders) {
    if (!orders || orders.length === 0) {
      activeOrdersTitle.textContent = 'Active Orders (0)';
      ordersList.innerHTML = '<div class="empty-state" style="text-align: center; color: rgba(255,255,255,0.5); padding: 40px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;">You have no orders yet.</div>';
      return;
    }

    const activeCount = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
    activeOrdersTitle.textContent = `Active Orders (${activeCount})`;

    ordersList.innerHTML = orders.map(order => buildOrderCard(order)).join('');
  }

  function buildOrderCard(order) {
    const tableText = order.table_number ? `Table ${order.table_number}` : 'Takeaway';
    const dateObj = new Date(order.created_at);
    const dateText = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
    
    const config = statusConfig[order.status] || { text: order.status, icon: 'fa-info-circle', badgeClass: 'placed', index: 0 };
    
    // Calculate progress percentage based on 4 steps: 0, 1=25%, 2=50%, 3=75%, 4=100%
    const progressWidth = order.status === 'cancelled' ? 0 : Math.min(100, Math.max(0, ((config.index - 0.5) / 3.5) * 100));

    // Build items HTML
    const itemsHtml = order.items.map(item => `
      <div class="item-row">
        <span class="item-name">${item.quantity}x ${item.name}</span>
        <span class="item-price">$${parseFloat(item.subtotal || item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const statusBadgeStyle = order.status === 'cancelled' ? 'color: #ef4444; background: rgba(239, 68, 68, 0.1);' : '';

    return `
      <div class="order-card">
        <div class="order-top-row">
          <div class="order-info">
            <span class="order-id">Order #${order.id}</span>
            <span class="order-meta">${tableText} • ${dateText}</span>
          </div>
          <span class="status-badge ${config.badgeClass}" style="${statusBadgeStyle}">
            <i class="fas ${config.icon}" style="font-size: 12px;"></i> ${config.text}
          </span>
        </div>

        ${order.status === 'cancelled' ? `
          <div style="margin: 15px 0; padding: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #ef4444; text-align: center;">
            This order was cancelled.
          </div>
        ` : `
        <div class="progress-tracker">
          <div class="progress-bar-wrap">
            <div class="progress-steps">
              <div class="step ${config.index >= 1 ? 'done' : ''}">
                <div class="step-circle"><i class="fas fa-check"></i></div>
                <span class="step-label">Placed</span>
              </div>
              <div class="step ${config.index >= 2 ? 'done' : ''}">
                <div class="step-circle"><i class="fas fa-check"></i></div>
                <span class="step-label">In Kitchen</span>
              </div>
              <div class="step ${config.index >= 3 ? 'done' : ''}">
                <div class="step-circle"><i class="fas fa-check"></i></div>
                <span class="step-label">Ready</span>
              </div>
              <div class="step ${config.index >= 4 ? 'done' : ''}">
                <div class="step-circle"><i class="fas fa-check"></i></div>
                <span class="step-label">Served</span>
              </div>
            </div>
            <div class="progress-line"><div class="progress-fill" style="width: ${progressWidth}%;"></div></div>
          </div>
        </div>
        `}

        <div class="order-items">
          <div class="order-divider"></div>
          ${itemsHtml}
          <div class="order-divider"></div>
          <div class="item-row total-row">
            <span class="item-name">Total (incl. tax)</span>
            <span class="item-price total-price">$${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Initial fetch
  fetchOrders();

  // Optionally poll for updates every 15 seconds
  setInterval(fetchOrders, 15000);
});

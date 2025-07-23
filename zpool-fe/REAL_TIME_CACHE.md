# Real-Time Cache Invalidation System

## 🎯 **Vấn đề đã giải quyết:**

Khi có ai transfer private tokens tới mình, cache balance sẽ sai vì:
- Cache không tự động update khi có transfer
- User phải đợi cache expire hoặc manual refresh
- Không có real-time notification về transfer events

## 🔧 **Giải pháp đã implement:**

### **1. Blockchain Event Listeners (`useBlockchainEvents.ts`)**

```typescript
// Listen cho các events từ ZPool contract
- Transfer events: Khi có transfer giữa users
- Deposit events: Khi user deposit tokens
- Withdraw events: Khi user withdraw tokens
```

**Tự động clear cache khi có events:**
- Clear cache cho sender và recipient
- Clear cache cho token được transfer
- Real-time cache invalidation

### **2. Transfer Notifications (`TransferNotifications.tsx`)**

```typescript
// Hiển thị real-time notifications
- Incoming transfers: 💰 Received tokens
- Outgoing transfers: 💸 Sent tokens
- Deposit/Withdraw notifications
```

**Features:**
- Real-time notifications với toast messages
- Recent transfers history (5 events cuối)
- Visual indicators cho incoming/outgoing
- Timestamp cho mỗi event

### **3. Cache Management**

**Cache Keys được clear:**
```typescript
// User cache
cacheService.clearUserCache(senderAddress);
cacheService.clearUserCache(recipientAddress);

// Token cache  
cacheService.clearTokenCache(tokenAddress);
```

**Cache TTL:**
- Balance cache: 15-30 giây
- Total balance cache: 20 giây
- FHE operations: 30-60 giây

## 🚀 **Cách hoạt động:**

### **1. Setup Event Listeners**
```typescript
// Khi user connect wallet
useBlockchainEvents({
  account,
  rpcUrl,
  isConnected: !!account
})
```

### **2. Real-time Event Detection**
```typescript
// Transfer event
contract.on('Transfer', (from, to, token, amount, event) => {
  // Clear cache cho cả sender và recipient
  clearCacheForTransfer(from, to, token);
  
  // Show notification
  showInfo(`💰 Received ${amount} tokens`);
});
```

### **3. Automatic Cache Invalidation**
```typescript
// Cache được clear ngay lập tức
- User balance cache
- Token balance cache  
- Total balance cache
```

### **4. UI Updates**
```typescript
// Balance tự động refresh
- useTotalBalance hook detect cache changes
- UI update với balance mới
- Real-time notifications
```

## 📊 **Performance Benefits:**

### **Before:**
- ❌ Cache sai khi có transfer
- ❌ User phải manual refresh
- ❌ Không biết khi nào có transfer
- ❌ Balance outdated

### **After:**
- ✅ Real-time cache invalidation
- ✅ Automatic balance updates
- ✅ Instant notifications
- ✅ Accurate balance display

## 🔄 **Event Flow:**

```
1. User A transfer tokens to User B
   ↓
2. ZPool contract emit Transfer event
   ↓
3. Event listener detect event
   ↓
4. Clear cache for User A and User B
   ↓
5. Show notification to User B
   ↓
6. Balance automatically refresh
   ↓
7. UI update với balance mới
```

## 🛠 **Technical Implementation:**

### **Event Listener Setup:**
```typescript
const setupEventListeners = async () => {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(ZPOOL_ADDRESS, ZPOOL_ABI, provider);
  
  // Listen for events
  contract.on('Transfer', handleTransfer);
  contract.on('Deposit', handleDeposit);
  contract.on('Withdraw', handleWithdraw);
};
```

### **Cache Invalidation:**
```typescript
const clearCacheForTransfer = (from, to, token) => {
  cacheService.clearUserCache(from);
  cacheService.clearUserCache(to);
  cacheService.clearTokenCache(token);
};
```

### **Notification System:**
```typescript
const showTransferNotification = (event) => {
  if (event.type === 'incoming') {
    showInfo(`💰 Received ${amount} tokens`);
  } else {
    showInfo(`💸 Sent ${amount} tokens`);
  }
};
```

## 🎉 **Kết quả:**

- **Real-time balance updates** khi có transfer
- **Instant notifications** cho mọi transfer events
- **Accurate cache management** tự động
- **Better user experience** với real-time feedback
- **No manual refresh needed** nữa

## 🔧 **Maintenance:**

- Event listeners tự động cleanup khi component unmount
- Error handling cho network issues
- Fallback mechanisms nếu events fail
- Performance optimized với debounced updates 
# CSS Structure

CSS đã được tách thành các file riêng biệt để dễ debug và maintain:

## Cấu trúc thư mục

```
src/styles/
├── App.css                    # CSS chính cho App component
├── index.css                  # Global styles và reset
├── README.md                  # File này
└── components/                # CSS cho từng component
    ├── PageContainer.css      # Container cho các trang
    ├── Form.css              # Form elements (input, button)
    ├── ActionToggle.css      # Toggle buttons cho deposit/withdraw
    ├── StatusMessage.css     # Status messages
    ├── InfoBox.css           # Info boxes
    ├── Header.css            # Header component
    ├── TotalBalanceDisplay.css # Balance display và token selector
    ├── Body.css              # Body component với network warning
    ├── Footer.css            # Footer component
    └── AllowanceDisplay.css  # Allowance display
```

## Các file CSS

### Global Styles
- **index.css**: Global styles, scrollbar, focus states, accessibility

### Main App
- **App.css**: Layout chính, main content, balance display, connect section

### Component Styles
- **PageContainer.css**: Container cho các trang với backdrop blur
- **Form.css**: Input fields, buttons, form layout
- **ActionToggle.css**: Toggle buttons cho deposit/withdraw
- **StatusMessage.css**: Success, error, info messages
- **InfoBox.css**: Information boxes với hướng dẫn
- **Header.css**: Header với logo, tabs, account dropdown
- **TotalBalanceDisplay.css**: Balance display và token selector
- **Body.css**: Body component với network warning
- **Footer.css**: Footer component
- **AllowanceDisplay.css**: Allowance display

## Components đã loại bỏ (dư thừa)

- ❌ **Navigation.tsx** - Không cần thiết (Header đã có tabs)
- ❌ **BalanceDisplay.tsx** - Không cần thiết (TotalBalanceDisplay đã đủ)
- ❌ **TokenSelector.tsx** - Không cần thiết (TotalBalanceDisplay đã có token selector)

## Lợi ích

1. **Dễ debug**: Mỗi component có CSS riêng, dễ tìm và sửa lỗi
2. **Clean code**: Loại bỏ CSS dư thừa và trùng lặp
3. **Maintainable**: Dễ maintain và update từng component
4. **Modular**: Có thể tái sử dụng CSS cho component khác
5. **Performance**: Chỉ load CSS cần thiết cho từng component

## Cách sử dụng

Mỗi component import CSS riêng:

```tsx
import '../styles/components/PageContainer.css';
import '../styles/components/Form.css';
```

## Responsive Design

Tất cả CSS đều có responsive breakpoints cho mobile (max-width: 768px). 
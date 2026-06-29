import React, { useState } from "react";
import {
  ArrowLeft,
  BatteryCharging,
  Bed,
  ChevronDown,
  ChevronRight,
  Circle,
  Coffee,
  CreditCard,
  FileText,
  Gift,
  Home,
  House,
  MapPin,
  MessageCircle,
  Minus,
  MoreHorizontal,
  Package,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  Trash2,
  User,
  WalletCards,
  Wifi,
} from "lucide-react";
import AdminApp from "./AdminApp";
import {
  defaultCloudSettings,
  loadCloudContent,
  publishCloudContent,
  type CloudSettings,
  type CloudStatus,
} from "./cloud";
import { defaultContent, type GridContent, type Product, type Tab } from "./data";

type Overlay = "combo" | "breakfast" | "orderDetail" | null;
type Workspace = "admin" | "preview";

function App() {
  const [content, setContent] = useLocalState<GridContent>("grid-content", defaultContent);
  const [cloudSettings, setCloudSettings] = useLocalState<CloudSettings>("grid-cloud-settings", defaultCloudSettings);
  const [githubToken, setGithubToken] = useLocalState("grid-github-token", "");
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>({
    state: "idle",
    message: "准备同步线上数据。",
  });
  const requestedWorkspace = getRequestedWorkspace();
  const [workspace, setWorkspace] = useState<Workspace>(requestedWorkspace ?? "preview");

  const pullCloudContent = React.useCallback(
    async (visible = true) => {
      if (visible) setCloudStatus({ state: "loading", message: "正在读取线上数据..." });

      try {
        const remoteContent = await loadCloudContent();
        setContent(remoteContent);
        setCloudStatus({ state: "ready", message: "已读取线上数据，点单页会使用最新内容。" });
      } catch (error) {
        setCloudStatus({
          state: "error",
          message: error instanceof Error ? error.message : "读取线上数据失败，当前使用本地数据。",
        });
      }
    },
    [setContent],
  );

  const publishToCloud = React.useCallback(async () => {
    setCloudStatus({ state: "publishing", message: "正在发布到线上数据文件..." });

    try {
      await publishCloudContent(cloudSettings, githubToken, content);
      setCloudStatus({ state: "ready", message: "已发布到线上。客人刷新点单页后会看到最新内容。" });
    } catch (error) {
      setCloudStatus({
        state: "error",
        message: error instanceof Error ? error.message : "发布失败，请检查 GitHub 令牌和网络。",
      });
    }
  }, [cloudSettings, content, githubToken]);

  React.useEffect(() => {
    void pullCloudContent(false);
  }, [pullCloudContent]);

  React.useEffect(() => {
    if (requestedWorkspace && workspace !== requestedWorkspace) setWorkspace(requestedWorkspace);
  }, [requestedWorkspace, setWorkspace, workspace]);

  if (workspace === "admin") {
    return (
      <AdminApp
        content={content}
        setContent={setContent}
        cloud={{
          settings: cloudSettings,
          setSettings: setCloudSettings,
          token: githubToken,
          setToken: setGithubToken,
          status: cloudStatus,
          onPull: () => pullCloudContent(),
          onPublish: publishToCloud,
        }}
        onPreview={() => setWorkspace("preview")}
        onReset={() => setContent(defaultContent)}
      />
    );
  }

  return <PreviewApp content={content} onAdmin={() => setWorkspace("admin")} />;
}

function PreviewApp({ content, onAdmin }: { content: GridContent; onAdmin: () => void }) {
  const [tab, setTab] = useLocalState<Tab>("grid-tab", "home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [orderCategory, setOrderCategory] = useState(content.categories[0] ?? "咖啡餐搭");
  const [pickupType, setPickupType] = useState<"自取" | "外卖">("自取");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bag, setBag] = useState(0);

  const openTab = (next: Tab) => {
    setOverlay(null);
    setSelectedProduct(null);
    setTab(next);
  };

  return (
    <div className="preview-shell">
      <button className="return-admin" onClick={onAdmin}>
        返回后台
      </button>
      <main className="app-shell">
        <section className="phone-frame">
          {overlay === "combo" && <ComboPage content={content} onBack={() => setOverlay(null)} />}
          {overlay === "breakfast" && <BreakfastPage content={content} onBack={() => setOverlay(null)} />}
          {overlay === "orderDetail" && <OrderDetail content={content} onBack={() => setOverlay(null)} />}
          {!overlay && (
            <>
              {tab === "home" && (
                <HomePage
                  content={content}
                  goOrder={() => openTab("order")}
                  goMall={() => openTab("mall")}
                  goMember={() => openTab("member")}
                />
              )}
              {tab === "order" && (
                <OrderPage
                  content={content}
                  activeCategory={orderCategory}
                  pickupType={pickupType}
                  onCategory={setOrderCategory}
                  onPickup={setPickupType}
                  onProduct={(product) => {
                    if (product.action === "combo") setOverlay("combo");
                    else if (product.action === "breakfast") setOverlay("breakfast");
                    else setSelectedProduct(product);
                  }}
                />
              )}
              {tab === "mall" && <MallPage content={content} bag={bag} addBag={() => setBag((count) => count + 1)} />}
              {tab === "orders" && <OrdersPage content={content} openDetail={() => setOverlay("orderDetail")} />}
              {tab === "member" && <MemberPage content={content} />}
              <BottomNav active={tab} onChange={openTab} />
            </>
          )}
          {selectedProduct && (
            <ProductSheet product={selectedProduct} store={content.store} onClose={() => setSelectedProduct(null)} />
          )}
        </section>
      </main>
    </div>
  );
}

function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const saved = window.localStorage.getItem(key);

    if (!saved) return initial;

    try {
      return JSON.parse(saved) as T;
    } catch {
      return initial;
    }
  });

  React.useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function PhoneStatus({ light = false }: { light?: boolean }) {
  return (
    <div className={`status-bar ${light ? "is-light" : ""}`}>
      <div className="status-left">
        <span>00:00</span>
        <Bed size={17} strokeWidth={3} />
      </div>
      <div className="status-right">
        <span className="signal-bars">
          <i />
          <i />
          <i />
        </span>
        <Wifi size={18} strokeWidth={3} />
        <span className="battery">
          82
          <BatteryCharging size={12} />
        </span>
      </div>
    </div>
  );
}

function MiniCapsule({ tint = "light" }: { tint?: "light" | "dark" }) {
  return (
    <div className={`mini-capsule ${tint}`}>
      <MoreHorizontal size={26} strokeWidth={3} />
      <span />
      <Circle size={22} strokeWidth={4} />
    </div>
  );
}

function BrandMark({ name = "GridCoffee" }: { name?: string }) {
  return (
    <span className="brand-mark">
      <span />
      {name}
    </span>
  );
}

function HomePage({
  content,
  goOrder,
  goMall,
  goMember,
}: {
  content: GridContent;
  goOrder: () => void;
  goMall: () => void;
  goMember: () => void;
}) {
  const progressPercent = getProgressPercent(content.member.progressCurrent, content.member.progressTarget);

  const goTarget = (target: Tab) => {
    if (target === "order") goOrder();
    else if (target === "mall") goMall();
    else goMember();
  };

  return (
    <div className="screen home-screen">
      <PhoneStatus light />
      <div className="wechat-top home-top">
        <button>了解更多</button>
        <MiniCapsule tint="dark" />
      </div>
      <section className="home-hero" style={{ backgroundImage: `url(${content.home.heroImage})` }}>
        <div>
          <BrandMark name={content.brandName} />
          <small>{content.home.heroEyebrow}</small>
        </div>
        <h1>{content.home.heroTitle}</h1>
        <p>{content.home.heroSubtitle}</p>
        <div className="hero-dots">
          <span />
          <span />
          <span />
        </div>
      </section>
      <section className="member-strip" onClick={goMember}>
        <div className="member-row">
          <h2>Hello, {content.member.userName}</h2>
          <span>
            暂无优惠券 <ChevronRight size={16} />
          </span>
        </div>
        <p>
          <b>{content.member.level}</b> {content.member.greeting}
        </p>
        <div className="progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <small>{content.member.upgradeText}</small>
      </section>
      <section className="pickup-grid">
        <button onClick={goOrder}>
          <strong>到店自取</strong>
          <span>在线点单免排队</span>
          <ChevronRight size={18} />
        </button>
        <button onClick={goOrder}>
          <strong>咖啡外送</strong>
          <span>满¥50免运费</span>
          <ChevronRight size={18} />
        </button>
      </section>
      <section className="quick-grid">
        {content.home.quickEntries.map((entry) => (
          <QuickEntry
            key={entry.id}
            image={entry.image}
            title={entry.title}
            sub={entry.sub}
            onClick={() => goTarget(entry.target)}
          />
        ))}
      </section>
      <section className="project-banner">
        <BrandMark name={content.brandName} />
        <h3>{content.home.projectTitle}</h3>
        <span>{content.home.projectStatus}</span>
      </section>
      <section className="store-section">
        <h2>{content.home.storeSectionTitle}</h2>
        <img src={content.home.storeImage} alt="Grid Coffee 门店" />
      </section>
    </div>
  );
}

function QuickEntry({ image, title, sub, onClick }: { image: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button className="quick-entry" onClick={onClick}>
      <img src={image} alt="" />
      <strong>{title}</strong>
      <span>{sub}</span>
    </button>
  );
}

function OrderPage({
  content,
  activeCategory,
  pickupType,
  onCategory,
  onPickup,
  onProduct,
}: {
  content: GridContent;
  activeCategory: string;
  pickupType: "自取" | "外卖";
  onCategory: (category: string) => void;
  onPickup: (type: "自取" | "外卖") => void;
  onProduct: (product: Product) => void;
}) {
  const fallbackProducts = [
    content.productsByCategory.热卖TOP?.[0],
    content.productsByCategory.经典美式?.[0],
    content.productsByCategory.热卖TOP?.[1],
  ].filter(Boolean) as Product[];
  const products = content.productsByCategory[activeCategory]?.length
    ? content.productsByCategory[activeCategory]
    : fallbackProducts;

  return (
    <div className="screen order-screen">
      <PhoneStatus />
      <div className="order-header">
        <div className="order-mode">
          {(["自取", "外卖"] as const).map((type) => (
            <button key={type} className={pickupType === type ? "active" : ""} onClick={() => onPickup(type)}>
              {type}
            </button>
          ))}
        </div>
        <MiniCapsule />
      </div>
      <div className="store-info">
        <div>
          <h1>
            {content.store.name} <ChevronRight size={17} />
          </h1>
          <p>
            <MapPin size={17} /> 距你 {content.store.distance}
          </p>
        </div>
        <button className="search-pill">
          <Search size={18} /> 搜饮品
        </button>
      </div>
      {activeCategory === content.categories[0] && (
        <div className="order-banners">
          {content.orderBanners.map((banner) => (
            <img key={banner} src={banner} alt="" />
          ))}
        </div>
      )}
      <div className="order-layout">
        <aside>
          {content.categories.map((category) => (
            <button key={category} className={category === activeCategory ? "active" : ""} onClick={() => onCategory(category)}>
              {category}
            </button>
          ))}
        </aside>
        <section className="product-column">
          <h2>{activeCategory}</h2>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} onClick={() => onProduct(product)} />
          ))}
        </section>
      </div>
      <ClosedBar store={content.store} />
    </div>
  );
}

function ProductRow({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <article className="product-row" onClick={onClick}>
      <img src={product.image} alt="" />
      <div className="product-copy">
        <h3>{product.name}</h3>
        <div className="tags">
          {product.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p>{product.desc}</p>
        <strong>
          ¥{product.price}
          <small>起</small>
          {product.originalPrice && <del>¥{product.originalPrice}</del>}
        </strong>
      </div>
      <button
        className="plus-button"
        aria-label={`选择 ${product.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
      >
        <Plus size={24} />
      </button>
    </article>
  );
}

function ClosedBar({ store }: { store: GridContent["store"] }) {
  return (
    <div className="closed-bar">
      <strong>{store.closedMessage}</strong>
      <span>
        营业时间
        <br />
        {store.businessHours}
      </span>
    </div>
  );
}

function ProductSheet({
  product,
  store,
  onClose,
}: {
  product: Product;
  store: GridContent["store"];
  onClose: () => void;
}) {
  const [temp, setTemp] = useState("冰");
  const [size, setSize] = useState("10oz");
  const [bean, setBean] = useState("D1");

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="product-sheet" onClick={(event) => event.stopPropagation()}>
        <button className="sheet-close" onClick={onClose}>
          ×
        </button>
        <img src={product.image} alt="" />
        <h2>{product.name}</h2>
        <p>{product.desc}</p>
        <SpecGroup label="温度" value={temp} options={["冰", "热"]} onChange={setTemp} />
        <SpecGroup label="杯型" value={size} options={["10oz", "12oz"]} onChange={setSize} />
        <SpecGroup label="咖啡豆" value={bean} options={["D1", "L3"]} onChange={setBean} />
        <div className="sheet-bottom">
          <strong>¥{product.price}</strong>
          <button disabled>{store.closedMessage.replace("抱歉，", "该")}</button>
        </div>
      </section>
    </div>
  );
}

function SpecGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <div className="spec-group">
      <h3>{label}</h3>
      <div>
        {options.map((option) => (
          <button key={option} className={option === value ? "active" : ""} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ComboPage({ content, onBack }: { content: GridContent; onBack: () => void }) {
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [gift, setGift] = useState("");
  const [qty, setQty] = useState(1);
  const selectedAdd = content.combo.options.find((item) => item.id === first)?.add ?? 0;
  const selectedAdd2 = content.combo.options.find((item) => item.id === second)?.add ?? 0;
  const total = content.combo.basePrice + selectedAdd + selectedAdd2;
  const complete = first && second && gift;

  return (
    <div className="screen detail-screen combo-screen">
      <PhoneStatus />
      <SimpleHeader title="选择套餐" onBack={onBack} />
      <div className="combo-content">
        <h1>{content.combo.title}</h1>
        <div className="tags">
          {content.combo.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <ChoicePool title="饮品1" hint="请选择 1 份" options={content.combo.options} selected={first} setSelected={setFirst} />
        <ChoicePool title="饮品2" hint="请选择 1 份" options={content.combo.options} selected={second} setSelected={setSecond} />
        <section className="choice-pool">
          <div className="pool-head">
            <h2>赠品</h2>
            <span>请选择 1 份</span>
          </div>
          <button className={`option-card gift-card ${gift ? "selected" : ""}`} onClick={() => setGift("poetry-box")}>
            <img src={content.combo.giftImage} alt="" />
            <strong>{content.combo.giftName}</strong>
          </button>
        </section>
      </div>
      <div className="selection-bar">
        <span>{complete ? `已选套餐 ¥${total * qty}` : "套餐未完成选择"}</span>
        <div className="stepper">
          <button onClick={() => setQty((value) => Math.max(1, value - 1))}>
            <Minus size={17} />
          </button>
          <b>{qty}</b>
          <button onClick={() => setQty((value) => value + 1)}>
            <Plus size={17} />
          </button>
        </div>
        <button disabled>{content.store.closedMessage.replace("抱歉，", "该")}</button>
      </div>
    </div>
  );
}

function ChoicePool({
  title,
  hint,
  options,
  selected,
  setSelected,
}: {
  title: string;
  hint: string;
  options: GridContent["combo"]["options"];
  selected: string;
  setSelected: (id: string) => void;
}) {
  return (
    <section className="choice-pool">
      <div className="pool-head">
        <h2>{title}</h2>
        <span>{hint}</span>
      </div>
      <div className="option-grid">
        {options.map((option) => (
          <button key={option.id} className={`option-card ${selected === option.id ? "selected" : ""}`} onClick={() => setSelected(option.id)}>
            <span className="price-add">+{option.add}元</span>
            <img src={option.image} alt="" />
            <strong>
              {option.tag && <em>{option.tag}</em>}
              {option.name}
            </strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function BreakfastPage({ content, onBack }: { content: GridContent; onBack: () => void }) {
  const [coffee, setCoffee] = useState("");
  const [bakery, setBakery] = useState("");
  const selectedCoffee = content.breakfast.coffee.find((item) => item.id === coffee);
  const selectedBakery = content.breakfast.bakery.find((item) => item.id === bakery);

  return (
    <div className="screen detail-screen breakfast-screen">
      <PhoneStatus />
      <div className="breakfast-hero" style={{ backgroundImage: `url(${content.breakfast.heroImage})` }}>
        <div className="floating-nav">
          <button onClick={onBack}>
            <ArrowLeft size={27} />
          </button>
          <button onClick={onBack}>
            <House size={27} />
          </button>
        </div>
        <MiniCapsule />
        <h1>
          {content.breakfast.title.split("\n").map((line) => (
            <React.Fragment key={line}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </h1>
        <p>{content.breakfast.subtitle}</p>
      </div>
      <div className="breakfast-pools">
        <BreakfastPool title="请选择其中一项" items={content.breakfast.coffee} selected={coffee} onSelect={setCoffee} />
        <BreakfastPool title="请选择其中一项" items={content.breakfast.bakery} selected={bakery} onSelect={setBakery} />
      </div>
      <div className="breakfast-cart">
        <ShoppingBag size={30} />
        <span>{selectedCoffee && selectedBakery ? `${selectedCoffee.name} + ${selectedBakery.name}` : "请分别在两个商品池中各选一件"}</span>
        <button disabled>添加至购物车</button>
      </div>
    </div>
  );
}

function BreakfastPool({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string;
  items: Product[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section className="breakfast-pool">
      <h2>{title}</h2>
      {items.map((item) => (
        <button key={item.id} className={`breakfast-item ${selected === item.id ? "selected" : ""}`} onClick={() => onSelect(item.id)}>
          <img src={item.image} alt="" />
          <div>
            <h3>{item.name}</h3>
            <div className="tags">
              {item.tags.slice(0, 2).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <p>{item.desc}</p>
            <strong>
              ¥{item.price}
              {item.originalPrice && <del>¥{item.originalPrice}</del>}
            </strong>
          </div>
          <Plus size={22} />
        </button>
      ))}
    </section>
  );
}

function MallPage({ content, bag, addBag }: { content: GridContent; bag: number; addBag: () => void }) {
  const [mallTab, setMallTab] = useState(content.mall.tabs[0] ?? "首页");

  return (
    <div className="screen mall-screen">
      <PhoneStatus light />
      <div className="mall-hero" style={{ backgroundImage: `url(${content.mall.heroImage})` }}>
        <div className="mall-top">
          <Home size={29} />
          <button>联系商城</button>
          <MiniCapsule tint="dark" />
        </div>
        <BrandMark name={content.brandName} />
        <h1>{content.mall.heroTitle}</h1>
        <p>{content.mall.heroSubtitle}</p>
      </div>
      <div className="mall-tabs">
        {content.mall.tabs.map((item) => (
          <button key={item} className={mallTab === item ? "active" : ""} onClick={() => setMallTab(item)}>
            {item}
          </button>
        ))}
      </div>
      <section className="mall-grid">
        {content.mall.products.map((product) => (
          <article key={product.id} className="mall-card">
            <div className="mall-image">
              <img src={product.image} alt="" />
              {product.soldOut && <span>已售罄</span>}
            </div>
            <h3>{product.name}</h3>
            <div className="tags">
              {product.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <strong>¥{product.price}</strong>
            <button disabled={product.soldOut} onClick={addBag}>
              <ChevronRight size={26} />
            </button>
          </article>
        ))}
      </section>
      <button className="floating-bag">
        <ShoppingBag size={30} />
        <span>购物袋</span>
        {bag > 0 && <b>{bag}</b>}
      </button>
    </div>
  );
}

function OrdersPage({ content, openDetail }: { content: GridContent; openDetail: () => void }) {
  const total = getOrderTotal(content);
  const count = getOrderCount(content);

  return (
    <div className="screen orders-screen">
      <PhoneStatus />
      <MiniCapsule />
      <header className="orders-head">
        <h1>订单中心</h1>
        <div className="orders-tabs">
          <button className="active">点餐订单</button>
          <button>商城订单</button>
          <button>
            其他订单 <ChevronDown size={17} />
          </button>
        </div>
      </header>
      <article className="order-card" onClick={openDetail}>
        <div className="order-card-head">
          <div>
            <h2>{content.sampleOrder.storeName}</h2>
            <p>{content.sampleOrder.orderTime}</p>
          </div>
          <span>{content.sampleOrder.status}</span>
          <Trash2 size={21} />
        </div>
        <div className="order-card-body">
          <div className="thumbs">
            {content.sampleOrder.items.slice(0, 3).map((item) => (
              <img key={item.id} src={item.image} alt="" />
            ))}
          </div>
          <strong>
            ¥ {total}
            <small>共 {count} 件</small>
          </strong>
        </div>
        <div className="order-actions">
          <button>
            <FileText size={20} /> 开具发票
          </button>
          <button>
            <ShoppingBag size={20} /> 再来一单
          </button>
        </div>
      </article>
    </div>
  );
}

function OrderDetail({ content, onBack }: { content: GridContent; onBack: () => void }) {
  const total = getOrderTotal(content);

  return (
    <div className="screen order-detail-screen">
      <PhoneStatus light />
      <div className="green-title">
        <div className="floating-nav compact">
          <button onClick={onBack}>
            <ArrowLeft size={27} />
          </button>
          <button onClick={onBack}>
            <House size={27} />
          </button>
        </div>
        <h1>订单详情</h1>
        <MiniCapsule tint="dark" />
      </div>
      <div className="order-detail-content">
        <img className="detail-ad" src={content.home.storeImage} alt="" />
        <section className="pickup-number">
          <div>
            <span>取餐号</span>
            <strong>{content.sampleOrder.pickupNo}</strong>
          </div>
          <b>订单{content.sampleOrder.status}</b>
        </section>
        <section className="detail-card">
          <div className="store-line">
            <div>
              <h2>{content.sampleOrder.storeName}</h2>
              <p>{content.sampleOrder.storeAddress}</p>
            </div>
            <button>联系门店</button>
          </div>
          {content.sampleOrder.items.map((item) => (
            <OrderItem key={item.id} image={item.image} name={item.name} spec={item.spec} price={item.price} qty={item.qty} />
          ))}
          <DetailRow label="商品总额" value={`¥${total}`} />
          <DetailRow label="实付金额" value={`¥${total}`} strong />
        </section>
        <section className="detail-card">
          <DetailRow label="下单时间" value={content.sampleOrder.orderTime} />
          <DetailRow label="订单编号" value={content.sampleOrder.orderNo} />
          <DetailRow label="支付方式" value={content.sampleOrder.payment} />
          <DetailRow label="取餐手机号" value={content.sampleOrder.phone} />
          <DetailRow label="订单备注" value={content.sampleOrder.remark} />
        </section>
        <button className="invoice-button">开具发票</button>
      </div>
    </div>
  );
}

function OrderItem({
  image,
  name,
  spec,
  price,
  qty,
}: {
  image: string;
  name: string;
  spec: string;
  price: number;
  qty: number;
}) {
  return (
    <div className="detail-item">
      <img src={image} alt="" />
      <div>
        <h3>{name}</h3>
        <p>{spec}</p>
      </div>
      <strong>
        ¥{price}
        <small>×{qty}</small>
      </strong>
    </div>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`detail-row ${strong ? "strong" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function MemberPage({ content }: { content: GridContent }) {
  const settingRows: Array<{ label: string; icon: React.ReactNode }> = content.member.settings.map((label, index) => ({
    label,
    icon: getSettingIcon(index),
  }));
  const progressPercent = getProgressPercent(content.member.progressCurrent, content.member.progressTarget);

  return (
    <div className="screen member-screen">
      <PhoneStatus light />
      <MiniCapsule tint="dark" />
      <section className="member-top">
        <div className="profile-row">
          <div className="avatar">
            <Coffee size={38} />
          </div>
          <div>
            <h1>{content.member.userName}</h1>
            <p>
              编辑资料 <ChevronRight size={15} />
            </p>
          </div>
        </div>
        <div className="member-card">
          <h2>
            {content.member.level}
            <br />
            <span>{content.member.levelEn}</span>
          </h2>
          <div className="member-progress">
            <p>{content.member.upgradeText}</p>
            <span>
              {content.member.progressCurrent}/{content.member.progressTarget}
            </span>
          </div>
          <div className="progress">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="member-card-foot">
            <BrandMark name={content.brandName} />
            <span>有效期 {content.member.validUntil}</span>
          </div>
        </div>
      </section>
      <section className="benefits">
        <h2>会员权益</h2>
        <div className="benefit-grid">
          {content.member.benefits.map((benefit, index) => (
            <Benefit key={benefit.id} icon={getBenefitIcon(index)} title={benefit.title} value={benefit.value} />
          ))}
        </div>
      </section>
      <section className="settings">
        <h2>设置</h2>
        {settingRows.map((row) => (
          <button key={row.label}>
            <span>
              {row.icon}
              {row.label}
            </span>
            <ChevronRight size={20} />
          </button>
        ))}
      </section>
    </div>
  );
}

function Benefit({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="benefit">
      {icon}
      <strong>{title}</strong>
      <span>{value}</span>
    </div>
  );
}

function SimpleHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="simple-header">
      <button onClick={onBack}>
        <ArrowLeft size={24} />
      </button>
      <h1>{title}</h1>
      <MiniCapsule />
    </header>
  );
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: "home", label: "首页", icon: <Home size={20} /> },
    { key: "order", label: "点单", icon: <Coffee size={20} /> },
    { key: "mall", label: "商城", icon: <ShoppingBag size={20} /> },
    { key: "orders", label: "订单", icon: <ReceiptText size={20} /> },
    { key: "member", label: "会员", icon: <User size={20} /> },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((item) => (
        <button key={item.key} className={active === item.key ? "active" : ""} onClick={() => onChange(item.key)}>
          {item.icon}
          <span>{item.label}</span>
          <i />
        </button>
      ))}
    </nav>
  );
}

function getProgressPercent(current: number, target: number) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function getOrderTotal(content: GridContent) {
  return content.sampleOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getOrderCount(content: GridContent) {
  return content.sampleOrder.items.reduce((sum, item) => sum + item.qty, 0);
}

function getBenefitIcon(index: number) {
  const icons = [<WalletCards />, <TicketPercent />, <Gift />, <CreditCard />];
  return icons[index] ?? <WalletCards />;
}

function getSettingIcon(index: number) {
  const icons = [<FileText />, <MapPin />, <ShieldCheck />, <ReceiptText />, <Package />, <MessageCircle />];
  return icons[index] ?? <Package />;
}

function getRequestedWorkspace(): Workspace | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("admin") === "1") return "admin";
  if (params.get("preview") === "1") return "preview";
  return null;
}

export default App;

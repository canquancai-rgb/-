import React, { useMemo, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Coffee,
  FileText,
  Grid2X2,
  Home,
  Layers3,
  Package,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Store,
  User,
  WalletCards,
} from "lucide-react";
import { asset, type ComboOption, type GridContent, type MallProduct, type Product } from "./data";

type AdminSection = "dashboard" | "home" | "products" | "combo" | "mall" | "orders" | "member" | "data";

type AdminAppProps = {
  content: GridContent;
  setContent: React.Dispatch<React.SetStateAction<GridContent>>;
  onPreview: () => void;
  onReset: () => void;
};

const imageChoices = [
  asset("home-hero-bg.jpg"),
  asset("banner-coldbrew-natural.jpg"),
  asset("banner-coldbrew-upgrade.jpg"),
  asset("banner-breakfast.jpg"),
  asset("p-coldbrew-combo.jpg"),
  asset("p-roman-americano.jpg"),
  asset("p-americano.jpg"),
  asset("p-salt-americano.jpg"),
  asset("p-white-butter-latte.jpg"),
  asset("p-salty-latte.jpg"),
  asset("p-bread-sourdough.jpg"),
  asset("p-maritozzo-tea.jpg"),
  asset("p-maritozzo-pistachio.jpg"),
  asset("mall-hero-capsule.jpg"),
  asset("mall-l48.jpg"),
  asset("mall-w41.jpg"),
  asset("mall-capsule-yirgacheffe.jpg"),
  asset("mall-capsule-kenya.jpg"),
  asset("mall-yunnan-box.jpg"),
  asset("mall-l3-bag.jpg"),
  asset("mall-ethiopia-box.jpg"),
  asset("mall-dark-box.jpg"),
  asset("order-detail-qr.jpg"),
];

const adminNav: Array<{ key: AdminSection; label: string; icon: React.ReactNode; group: string }> = [
  { key: "dashboard", label: "首页", icon: <Home size={16} />, group: "总览" },
  { key: "home", label: "小程序首页", icon: <Grid2X2 size={16} />, group: "客户端中心" },
  { key: "products", label: "菜品", icon: <Coffee size={16} />, group: "餐厅餐品管理" },
  { key: "combo", label: "套餐", icon: <Layers3 size={16} />, group: "餐厅餐品管理" },
  { key: "mall", label: "商城商品", icon: <ShoppingBag size={16} />, group: "商户中心" },
  { key: "orders", label: "订单管理", icon: <ReceiptText size={16} />, group: "订单管理" },
  { key: "member", label: "会员中心", icon: <User size={16} />, group: "用户中心" },
  { key: "data", label: "数据备份", icon: <FileText size={16} />, group: "文件中心" },
];

function AdminApp({ content, setContent, onPreview, onReset }: AdminAppProps) {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const pageTab = getPageTab(section);
  const groupedNav = useMemo(() => {
    return adminNav.reduce<Record<string, typeof adminNav>>((groups, item) => {
      groups[item.group] = [...(groups[item.group] ?? []), item];
      return groups;
    }, {});
  }, []);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo">OGS商户管理</div>
        <nav>
          {Object.entries(groupedNav).map(([group, items]) => (
            <section key={group}>
              <button className="admin-menu-group">
                <span>{group}</span>
                <ChevronDown size={15} />
              </button>
              {items.map((item) => (
                <button
                  key={item.key}
                  className={`admin-menu-item ${section === item.key ? "active" : ""}`}
                  onClick={() => setSection(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">首页 / {getBreadcrumb(section)}</div>
          <div className="admin-store-pills">
            <span>{content.store.name}</span>
            <span>营业中心：Grid Coffee</span>
          </div>
          <div className="admin-tools">
            <Search size={17} />
            <Settings size={17} />
            <button onClick={onPreview}>预览小程序</button>
          </div>
        </header>
        <div className="admin-page-tabs">
          {["首页", "菜品", "套餐", "菜单", "推荐菜单", "菜品属性", "时段", "点餐订单", "支付订单"].map((tab) => (
            <button key={tab} className={pageTab === tab ? "active" : ""}>
              {tab}
            </button>
          ))}
        </div>
        <div className="admin-content">
          {section === "dashboard" && <Dashboard content={content} onJump={setSection} />}
          {section === "home" && <HomeEditor content={content} setContent={setContent} />}
          {section === "products" && <ProductManager content={content} setContent={setContent} />}
          {section === "combo" && <ComboManager content={content} setContent={setContent} />}
          {section === "mall" && <MallManager content={content} setContent={setContent} />}
          {section === "orders" && <OrdersManager content={content} setContent={setContent} />}
          {section === "member" && <MemberManager content={content} setContent={setContent} />}
          {section === "data" && <DataManager content={content} setContent={setContent} onReset={onReset} />}
        </div>
      </section>
    </main>
  );
}

function Dashboard({ content, onJump }: { content: GridContent; onJump: (section: AdminSection) => void }) {
  const productCount = Object.values(content.productsByCategory).reduce((sum, products) => sum + products.length, 0);
  const soldOutCount =
    Object.values(content.productsByCategory).flat().filter((product) => product.soldOut).length +
    content.mall.products.filter((product) => product.soldOut).length;

  const stats = [
    { label: "菜品分类", value: content.categories.length, icon: <Coffee /> },
    { label: "点单商品", value: productCount, icon: <Package /> },
    { label: "商城商品", value: content.mall.products.length, icon: <ShoppingBag /> },
    { label: "售罄商品", value: soldOutCount, icon: <BarChart3 /> },
  ];

  return (
    <div className="admin-stack">
      <section className="admin-panel">
        <SectionTitle title="本地还原后台" subtitle="当前数据只保存在这个项目和浏览器本地存储，不会写入线上 OGS 后台。" />
        <div className="admin-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="admin-stat">
              {stat.icon}
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <SectionTitle title="模块" subtitle="按线上 OGS 后台的菜单结构重新组织小程序内容。" />
        <table className="admin-table">
          <thead>
            <tr>
              <th>模块</th>
              <th>当前内容</th>
              <th>用途</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>小程序首页</td>
              <td>{content.home.heroTitle}</td>
              <td>活动 Hero、快捷入口、会员提示、门店入口</td>
              <td>
                <button onClick={() => onJump("home")}>编辑</button>
              </td>
            </tr>
            <tr>
              <td>菜品</td>
              <td>{productCount} 个点单商品</td>
              <td>分类、价格、标签、图片、描述、售卖状态</td>
              <td>
                <button onClick={() => onJump("products")}>编辑</button>
              </td>
            </tr>
            <tr>
              <td>套餐</td>
              <td>{content.combo.options.length} 个冷萃选项</td>
              <td>依云冷萃双杯组合、早餐任意搭商品池</td>
              <td>
                <button onClick={() => onJump("combo")}>编辑</button>
              </td>
            </tr>
            <tr>
              <td>商城</td>
              <td>{content.mall.products.length} 个商城商品</td>
              <td>咖啡豆、胶囊、挂耳、周边商品</td>
              <td>
                <button onClick={() => onJump("mall")}>编辑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function HomeEditor({ content, setContent }: Pick<AdminAppProps, "content" | "setContent">) {
  const updateHome = (patch: Partial<GridContent["home"]>) => {
    setContent((current) => ({ ...current, home: { ...current.home, ...patch } }));
  };
  const updateStore = (patch: Partial<GridContent["store"]>) => {
    setContent((current) => ({ ...current, store: { ...current.store, ...patch } }));
  };
  const updateQuick = (id: string, patch: Partial<GridContent["home"]["quickEntries"][number]>) => {
    setContent((current) => ({
      ...current,
      home: {
        ...current.home,
        quickEntries: current.home.quickEntries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
      },
    }));
  };

  return (
    <div className="admin-grid two">
      <section className="admin-panel">
        <SectionTitle title="首页内容" subtitle="这些字段会实时驱动小程序首页预览。" />
        <Field label="品牌名">
          <input value={content.brandName} onChange={(event) => setContent((current) => ({ ...current, brandName: event.target.value }))} />
        </Field>
        <Field label="Hero 标题">
          <input value={content.home.heroTitle} onChange={(event) => updateHome({ heroTitle: event.target.value })} />
        </Field>
        <Field label="Hero 副标题">
          <input value={content.home.heroSubtitle} onChange={(event) => updateHome({ heroSubtitle: event.target.value })} />
        </Field>
        <ImageField label="Hero 图片" value={content.home.heroImage} onChange={(heroImage) => updateHome({ heroImage })} />
        <Field label="产地活动标题">
          <input value={content.home.projectTitle} onChange={(event) => updateHome({ projectTitle: event.target.value })} />
        </Field>
        <Field label="产地活动状态">
          <input value={content.home.projectStatus} onChange={(event) => updateHome({ projectStatus: event.target.value })} />
        </Field>
      </section>
      <section className="admin-panel">
        <SectionTitle title="门店与营业状态" subtitle="点单页顶部和底部打烊条会使用这里的数据。" />
        <Field label="门店名称">
          <input value={content.store.name} onChange={(event) => updateStore({ name: event.target.value })} />
        </Field>
        <Field label="距离">
          <input value={content.store.distance} onChange={(event) => updateStore({ distance: event.target.value })} />
        </Field>
        <Field label="营业时间">
          <input value={content.store.businessHours} onChange={(event) => updateStore({ businessHours: event.target.value })} />
        </Field>
        <Field label="打烊提示">
          <input value={content.store.closedMessage} onChange={(event) => updateStore({ closedMessage: event.target.value })} />
        </Field>
        <ImageField label="门店/详情图" value={content.home.storeImage} onChange={(storeImage) => updateHome({ storeImage })} />
      </section>
      <section className="admin-panel span-two">
        <SectionTitle title="首页快捷入口" subtitle="对应首页四宫格入口。" />
        <div className="admin-editor-grid">
          {content.home.quickEntries.map((entry) => (
            <div className="admin-mini-form" key={entry.id}>
              <img src={entry.image} alt="" />
              <Field label="标题">
                <input value={entry.title} onChange={(event) => updateQuick(entry.id, { title: event.target.value })} />
              </Field>
              <Field label="副标题">
                <input value={entry.sub} onChange={(event) => updateQuick(entry.id, { sub: event.target.value })} />
              </Field>
              <Field label="跳转">
                <select value={entry.target} onChange={(event) => updateQuick(entry.id, { target: event.target.value as GridContent["home"]["quickEntries"][number]["target"] })}>
                  <option value="order">点单</option>
                  <option value="mall">商城</option>
                  <option value="member">会员</option>
                </select>
              </Field>
              <ImageField label="图片" value={entry.image} onChange={(image) => updateQuick(entry.id, { image })} compact />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductManager({ content, setContent }: Pick<AdminAppProps, "content" | "setContent">) {
  const [activeCategory, setActiveCategory] = useState(content.categories[0] ?? "");
  const activeProducts = content.productsByCategory[activeCategory] ?? [];
  const [selectedId, setSelectedId] = useState(activeProducts[0]?.id ?? "");
  const selectedProduct = activeProducts.find((product) => product.id === selectedId) ?? activeProducts[0];

  React.useEffect(() => {
    if (!content.categories.includes(activeCategory)) setActiveCategory(content.categories[0] ?? "");
  }, [activeCategory, content.categories]);

  React.useEffect(() => {
    const products = content.productsByCategory[activeCategory] ?? [];
    if (!products.some((product) => product.id === selectedId)) setSelectedId(products[0]?.id ?? "");
  }, [activeCategory, content.productsByCategory, selectedId]);

  const addCategory = () => {
    const name = uniqueName("新分类", content.categories);
    setContent((current) => ({
      ...current,
      categories: [...current.categories, name],
      productsByCategory: { ...current.productsByCategory, [name]: [] },
    }));
    setActiveCategory(name);
  };

  const renameCategory = (name: string) => {
    const next = name.trim();
    if (!next || next === activeCategory) return;
    setContent((current) => {
      const productsByCategory = { ...current.productsByCategory, [next]: current.productsByCategory[activeCategory] ?? [] };
      delete productsByCategory[activeCategory];
      return {
        ...current,
        categories: current.categories.map((category) => (category === activeCategory ? next : category)),
        productsByCategory,
      };
    });
    setActiveCategory(next);
  };

  const addProduct = () => {
    const product: Product = {
      id: `product-${Date.now()}`,
      name: "新商品",
      price: 0,
      image: asset("p-americano.jpg"),
      tags: ["新建"],
      desc: "请输入商品描述",
    };
    setContent((current) => ({
      ...current,
      productsByCategory: {
        ...current.productsByCategory,
        [activeCategory]: [...(current.productsByCategory[activeCategory] ?? []), product],
      },
    }));
    setSelectedId(product.id);
  };

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setContent((current) => ({
      ...current,
      productsByCategory: {
        ...current.productsByCategory,
        [activeCategory]: (current.productsByCategory[activeCategory] ?? []).map((product) =>
          product.id === id ? { ...product, ...patch } : product,
        ),
      },
    }));
  };

  const removeProduct = (id: string) => {
    setContent((current) => ({
      ...current,
      productsByCategory: {
        ...current.productsByCategory,
        [activeCategory]: (current.productsByCategory[activeCategory] ?? []).filter((product) => product.id !== id),
      },
    }));
  };

  return (
    <div className="admin-grid product-admin">
      <section className="admin-panel">
        <SectionTitle title="菜品分类" subtitle="还原小程序左侧分类栏。" action={<button onClick={addCategory}><Plus size={15} />新增分类</button>} />
        <div className="category-list">
          {content.categories.map((category) => (
            <button key={category} className={category === activeCategory ? "active" : ""} onClick={() => setActiveCategory(category)}>
              {category}
              <span>{content.productsByCategory[category]?.length ?? 0}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="admin-panel">
        <SectionTitle
          title="商品列表"
          subtitle="选择商品后在右侧编辑。"
          action={<button onClick={addProduct}><Plus size={15} />新增商品</button>}
        />
        <Field label="当前分类名">
          <input value={activeCategory} onChange={(event) => renameCategory(event.target.value)} />
        </Field>
        <table className="admin-table selectable">
          <thead>
            <tr>
              <th>商品</th>
              <th>价格</th>
              <th>标签</th>
            </tr>
          </thead>
          <tbody>
            {activeProducts.map((product) => (
              <tr key={product.id} className={selectedProduct?.id === product.id ? "selected" : ""} onClick={() => setSelectedId(product.id)}>
                <td>{product.name}</td>
                <td>¥{product.price}</td>
                <td>{product.tags.join("、")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="admin-panel">
        <SectionTitle title="商品编辑" subtitle="图片路径可从现有素材中选择，也可手动填入。" />
        {selectedProduct ? (
          <ProductEditor product={selectedProduct} onChange={(patch) => updateProduct(selectedProduct.id, patch)} onRemove={() => removeProduct(selectedProduct.id)} />
        ) : (
          <EmptyState text="当前分类暂无商品，先新增一个商品。" />
        )}
      </section>
    </div>
  );
}

function ProductEditor({
  product,
  onChange,
  onRemove,
}: {
  product: Product;
  onChange: (patch: Partial<Product>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="entity-editor">
      <img className="editor-preview" src={product.image} alt="" />
      <Field label="商品名称">
        <input value={product.name} onChange={(event) => onChange({ name: event.target.value })} />
      </Field>
      <Field label="价格">
        <input type="number" value={product.price} onChange={(event) => onChange({ price: toNumber(event.target.value) })} />
      </Field>
      <Field label="原价">
        <input value={product.originalPrice ?? ""} onChange={(event) => onChange({ originalPrice: toOptionalNumber(event.target.value) })} />
      </Field>
      <Field label="标签">
        <input value={tagsToString(product.tags)} onChange={(event) => onChange({ tags: tagsFromString(event.target.value) })} />
      </Field>
      <Field label="商品类型">
        <select value={product.action ?? ""} onChange={(event) => onChange({ action: event.target.value ? (event.target.value as Product["action"]) : undefined })}>
          <option value="">普通单品</option>
          <option value="combo">套餐选择页</option>
          <option value="breakfast">早餐任意搭</option>
        </select>
      </Field>
      <ImageField label="图片" value={product.image} onChange={(image) => onChange({ image })} />
      <Field label="商品描述">
        <textarea rows={4} value={product.desc} onChange={(event) => onChange({ desc: event.target.value })} />
      </Field>
      <label className="admin-check">
        <input type="checkbox" checked={Boolean(product.soldOut)} onChange={(event) => onChange({ soldOut: event.target.checked })} />
        小程序显示为售罄
      </label>
      {onRemove && (
        <button className="danger-button" onClick={onRemove}>
          删除本地商品
        </button>
      )}
    </div>
  );
}

function ComboManager({ content, setContent }: Pick<AdminAppProps, "content" | "setContent">) {
  const [selectedOptionId, setSelectedOptionId] = useState(content.combo.options[0]?.id ?? "");
  const selectedOption = content.combo.options.find((option) => option.id === selectedOptionId) ?? content.combo.options[0];

  const updateCombo = (patch: Partial<GridContent["combo"]>) => {
    setContent((current) => ({ ...current, combo: { ...current.combo, ...patch } }));
  };
  const updateOption = (id: string, patch: Partial<ComboOption>) => {
    setContent((current) => ({
      ...current,
      combo: {
        ...current.combo,
        options: current.combo.options.map((option) => (option.id === id ? { ...option, ...patch } : option)),
      },
    }));
  };
  const addOption = () => {
    const option: ComboOption = {
      id: `combo-${Date.now()}`,
      name: "新冷萃选项",
      add: 0,
      image: asset("p-coldbrew-combo.jpg"),
    };
    updateCombo({ options: [...content.combo.options, option] });
    setSelectedOptionId(option.id);
  };
  const updateBreakfast = (patch: Partial<GridContent["breakfast"]>) => {
    setContent((current) => ({ ...current, breakfast: { ...current.breakfast, ...patch } }));
  };

  return (
    <div className="admin-grid two">
      <section className="admin-panel">
        <SectionTitle title="套餐基础信息" subtitle="对应依云冷萃双杯组合页面。" />
        <Field label="套餐名称">
          <input value={content.combo.title} onChange={(event) => updateCombo({ title: event.target.value })} />
        </Field>
        <Field label="基础价格">
          <input type="number" value={content.combo.basePrice} onChange={(event) => updateCombo({ basePrice: toNumber(event.target.value) })} />
        </Field>
        <Field label="标签">
          <input value={tagsToString(content.combo.tags)} onChange={(event) => updateCombo({ tags: tagsFromString(event.target.value) })} />
        </Field>
        <Field label="赠品名称">
          <input value={content.combo.giftName} onChange={(event) => updateCombo({ giftName: event.target.value })} />
        </Field>
        <ImageField label="赠品图片" value={content.combo.giftImage} onChange={(giftImage) => updateCombo({ giftImage })} />
      </section>
      <section className="admin-panel">
        <SectionTitle title="套餐选项" subtitle="饮品 1 和饮品 2 共用这一组选项。" action={<button onClick={addOption}><Plus size={15} />新增选项</button>} />
        <table className="admin-table selectable">
          <thead>
            <tr>
              <th>名称</th>
              <th>加价</th>
              <th>标签</th>
            </tr>
          </thead>
          <tbody>
            {content.combo.options.map((option) => (
              <tr key={option.id} className={selectedOption?.id === option.id ? "selected" : ""} onClick={() => setSelectedOptionId(option.id)}>
                <td>{option.name}</td>
                <td>+{option.add}</td>
                <td>{option.tag ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedOption && (
          <div className="entity-editor compact">
            <img className="editor-preview small" src={selectedOption.image} alt="" />
            <Field label="选项名称">
              <input value={selectedOption.name} onChange={(event) => updateOption(selectedOption.id, { name: event.target.value })} />
            </Field>
            <Field label="加价">
              <input type="number" value={selectedOption.add} onChange={(event) => updateOption(selectedOption.id, { add: toNumber(event.target.value) })} />
            </Field>
            <Field label="标签">
              <input value={selectedOption.tag ?? ""} onChange={(event) => updateOption(selectedOption.id, { tag: event.target.value || undefined })} />
            </Field>
            <ImageField label="图片" value={selectedOption.image} onChange={(image) => updateOption(selectedOption.id, { image })} compact />
          </div>
        )}
      </section>
      <section className="admin-panel span-two">
        <SectionTitle title="早餐任意搭" subtitle="编辑早餐套餐 Hero 和两个商品池。" />
        <div className="admin-grid two inner">
          <div>
            <Field label="标题">
              <textarea rows={2} value={content.breakfast.title} onChange={(event) => updateBreakfast({ title: event.target.value })} />
            </Field>
            <Field label="副标题">
              <input value={content.breakfast.subtitle} onChange={(event) => updateBreakfast({ subtitle: event.target.value })} />
            </Field>
            <ImageField label="Hero 图片" value={content.breakfast.heroImage} onChange={(heroImage) => updateBreakfast({ heroImage })} />
          </div>
          <div className="admin-summary-list">
            <strong>饮品池</strong>
            {content.breakfast.coffee.map((item) => (
              <span key={item.id}>{item.name} / ¥{item.price}</span>
            ))}
            <strong>烘焙池</strong>
            {content.breakfast.bakery.map((item) => (
              <span key={item.id}>{item.name} / ¥{item.price}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MallManager({ content, setContent }: Pick<AdminAppProps, "content" | "setContent">) {
  const [selectedId, setSelectedId] = useState(content.mall.products[0]?.id ?? "");
  const selectedProduct = content.mall.products.find((product) => product.id === selectedId) ?? content.mall.products[0];

  const updateMall = (patch: Partial<GridContent["mall"]>) => {
    setContent((current) => ({ ...current, mall: { ...current.mall, ...patch } }));
  };
  const updateProduct = (id: string, patch: Partial<MallProduct>) => {
    setContent((current) => ({
      ...current,
      mall: {
        ...current.mall,
        products: current.mall.products.map((product) => (product.id === id ? { ...product, ...patch } : product)),
      },
    }));
  };
  const addProduct = () => {
    const product: MallProduct = {
      id: `mall-${Date.now()}`,
      name: "新商城商品",
      price: 0,
      image: asset("mall-l48.jpg"),
      tags: ["新建"],
    };
    updateMall({ products: [...content.mall.products, product] });
    setSelectedId(product.id);
  };

  return (
    <div className="admin-grid two">
      <section className="admin-panel">
        <SectionTitle title="商城首页" subtitle="商城 Hero 和商品分类 Tab。" />
        <Field label="Hero 标题">
          <input value={content.mall.heroTitle} onChange={(event) => updateMall({ heroTitle: event.target.value })} />
        </Field>
        <Field label="Hero 副标题">
          <input value={content.mall.heroSubtitle} onChange={(event) => updateMall({ heroSubtitle: event.target.value })} />
        </Field>
        <ImageField label="Hero 图片" value={content.mall.heroImage} onChange={(heroImage) => updateMall({ heroImage })} />
        <Field label="分类 Tab">
          <input value={tagsToString(content.mall.tabs)} onChange={(event) => updateMall({ tabs: tagsFromString(event.target.value) })} />
        </Field>
      </section>
      <section className="admin-panel">
        <SectionTitle title="商城商品" subtitle="咖啡豆、胶囊、挂耳等商城内容。" action={<button onClick={addProduct}><Plus size={15} />新增商品</button>} />
        <table className="admin-table selectable">
          <thead>
            <tr>
              <th>商品</th>
              <th>价格</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {content.mall.products.map((product) => (
              <tr key={product.id} className={selectedProduct?.id === product.id ? "selected" : ""} onClick={() => setSelectedId(product.id)}>
                <td>{product.name}</td>
                <td>¥{product.price}</td>
                <td>{product.soldOut ? "已售罄" : "在售"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="admin-panel span-two">
        <SectionTitle title="商城商品编辑" />
        {selectedProduct && <MallProductEditor product={selectedProduct} onChange={(patch) => updateProduct(selectedProduct.id, patch)} />}
      </section>
    </div>
  );
}

function MallProductEditor({ product, onChange }: { product: MallProduct; onChange: (patch: Partial<MallProduct>) => void }) {
  return (
    <div className="entity-editor mall-edit">
      <img className="editor-preview" src={product.image} alt="" />
      <Field label="商品名称">
        <input value={product.name} onChange={(event) => onChange({ name: event.target.value })} />
      </Field>
      <Field label="价格">
        <input type="number" value={product.price} onChange={(event) => onChange({ price: toNumber(event.target.value) })} />
      </Field>
      <Field label="标签">
        <input value={tagsToString(product.tags)} onChange={(event) => onChange({ tags: tagsFromString(event.target.value) })} />
      </Field>
      <ImageField label="图片" value={product.image} onChange={(image) => onChange({ image })} />
      <label className="admin-check">
        <input type="checkbox" checked={Boolean(product.soldOut)} onChange={(event) => onChange({ soldOut: event.target.checked })} />
        小程序显示为已售罄
      </label>
    </div>
  );
}

function OrdersManager({ content, setContent }: Pick<AdminAppProps, "content" | "setContent">) {
  const total = content.sampleOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const updateOrder = (patch: Partial<GridContent["sampleOrder"]>) => {
    setContent((current) => ({ ...current, sampleOrder: { ...current.sampleOrder, ...patch } }));
  };
  const updateItem = (id: string, patch: Partial<GridContent["sampleOrder"]["items"][number]>) => {
    setContent((current) => ({
      ...current,
      sampleOrder: {
        ...current.sampleOrder,
        items: current.sampleOrder.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      },
    }));
  };

  return (
    <div className="admin-stack">
      <section className="admin-panel">
        <SectionTitle title="点餐订单样例" subtitle="用于还原小程序订单中心和订单详情页面，不连接真实订单。" />
        <div className="admin-form-grid">
          <Field label="门店">
            <input value={content.sampleOrder.storeName} onChange={(event) => updateOrder({ storeName: event.target.value })} />
          </Field>
          <Field label="订单状态">
            <input value={content.sampleOrder.status} onChange={(event) => updateOrder({ status: event.target.value })} />
          </Field>
          <Field label="下单时间">
            <input value={content.sampleOrder.orderTime} onChange={(event) => updateOrder({ orderTime: event.target.value })} />
          </Field>
          <Field label="取餐号">
            <input value={content.sampleOrder.pickupNo} onChange={(event) => updateOrder({ pickupNo: event.target.value })} />
          </Field>
          <Field label="订单编号">
            <input value={content.sampleOrder.orderNo} onChange={(event) => updateOrder({ orderNo: event.target.value })} />
          </Field>
          <Field label="支付方式">
            <input value={content.sampleOrder.payment} onChange={(event) => updateOrder({ payment: event.target.value })} />
          </Field>
          <Field label="手机号">
            <input value={content.sampleOrder.phone} onChange={(event) => updateOrder({ phone: event.target.value })} />
          </Field>
          <Field label="备注">
            <input value={content.sampleOrder.remark} onChange={(event) => updateOrder({ remark: event.target.value })} />
          </Field>
          <Field label="门店地址" wide>
            <input value={content.sampleOrder.storeAddress} onChange={(event) => updateOrder({ storeAddress: event.target.value })} />
          </Field>
        </div>
      </section>
      <section className="admin-panel">
        <SectionTitle title="订单商品" subtitle={`当前样例实付 ¥${total}`} />
        <table className="admin-table">
          <thead>
            <tr>
              <th>商品</th>
              <th>规格</th>
              <th>价格</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            {content.sampleOrder.items.map((item) => (
              <tr key={item.id}>
                <td><input value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value })} /></td>
                <td><input value={item.spec} onChange={(event) => updateItem(item.id, { spec: event.target.value })} /></td>
                <td><input type="number" value={item.price} onChange={(event) => updateItem(item.id, { price: toNumber(event.target.value) })} /></td>
                <td><input type="number" value={item.qty} onChange={(event) => updateItem(item.id, { qty: toNumber(event.target.value) })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="admin-panel">
        <SectionTitle title="支付订单查询" subtitle="按生产后台页面结构还原的本地占位表。" />
        <div className="payment-filter">
          <input placeholder="商家单号" />
          <input placeholder="渠道单号" />
          <input placeholder="订单编号" />
          <input value="2026-06-30" readOnly />
          <input value="2026-06-30" readOnly />
          <select defaultValue="">
            <option value="">支付方式</option>
            <option>微信支付</option>
          </select>
          <button>查询本地样例</button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>商家单号</th>
              <th>渠道单号</th>
              <th>订单编号</th>
              <th>金额</th>
              <th>支付平台</th>
              <th>交易时间</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GC-LOCAL</td>
              <td>WX-LOCAL</td>
              <td>{content.sampleOrder.orderNo}</td>
              <td>¥{total}</td>
              <td>{content.sampleOrder.payment}</td>
              <td>{content.sampleOrder.orderTime}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function MemberManager({ content, setContent }: Pick<AdminAppProps, "content" | "setContent">) {
  const updateMember = (patch: Partial<GridContent["member"]>) => {
    setContent((current) => ({ ...current, member: { ...current.member, ...patch } }));
  };
  const updateBenefit = (id: string, patch: Partial<GridContent["member"]["benefits"][number]>) => {
    setContent((current) => ({
      ...current,
      member: {
        ...current.member,
        benefits: current.member.benefits.map((benefit) => (benefit.id === id ? { ...benefit, ...patch } : benefit)),
      },
    }));
  };

  return (
    <div className="admin-grid two">
      <section className="admin-panel">
        <SectionTitle title="会员资料" subtitle="对应会员页顶部信息和会员卡。" />
        <Field label="用户名">
          <input value={content.member.userName} onChange={(event) => updateMember({ userName: event.target.value })} />
        </Field>
        <Field label="会员等级">
          <input value={content.member.level} onChange={(event) => updateMember({ level: event.target.value })} />
        </Field>
        <Field label="英文等级">
          <input value={content.member.levelEn} onChange={(event) => updateMember({ levelEn: event.target.value })} />
        </Field>
        <Field label="问候语">
          <input value={content.member.greeting} onChange={(event) => updateMember({ greeting: event.target.value })} />
        </Field>
        <Field label="当前消费">
          <input type="number" value={content.member.progressCurrent} onChange={(event) => updateMember({ progressCurrent: toNumber(event.target.value) })} />
        </Field>
        <Field label="升级目标">
          <input type="number" value={content.member.progressTarget} onChange={(event) => updateMember({ progressTarget: toNumber(event.target.value) })} />
        </Field>
        <Field label="有效期">
          <input value={content.member.validUntil} onChange={(event) => updateMember({ validUntil: event.target.value })} />
        </Field>
        <Field label="升级提示">
          <textarea rows={3} value={content.member.upgradeText} onChange={(event) => updateMember({ upgradeText: event.target.value })} />
        </Field>
      </section>
      <section className="admin-panel">
        <SectionTitle title="会员权益" subtitle="对应会员页四宫格。" />
        <div className="admin-editor-grid benefits-edit">
          {content.member.benefits.map((benefit) => (
            <div className="admin-mini-form" key={benefit.id}>
              <WalletCards size={22} />
              <Field label="标题">
                <input value={benefit.title} onChange={(event) => updateBenefit(benefit.id, { title: event.target.value })} />
              </Field>
              <Field label="数值">
                <input value={benefit.value} onChange={(event) => updateBenefit(benefit.id, { value: event.target.value })} />
              </Field>
            </div>
          ))}
        </div>
        <Field label="设置入口">
          <textarea rows={4} value={content.member.settings.join("\n")} onChange={(event) => updateMember({ settings: event.target.value.split("\n").filter(Boolean) })} />
        </Field>
      </section>
    </div>
  );
}

function DataManager({ content, setContent, onReset }: Pick<AdminAppProps, "content" | "setContent" | "onReset">) {
  const [draft, setDraft] = useState(JSON.stringify(content, null, 2));
  const [status, setStatus] = useState("可复制 JSON 作为本地备份。");

  const importDraft = () => {
    try {
      const parsed = JSON.parse(draft) as GridContent;
      setContent(parsed);
      setStatus("已导入到本地预览数据。");
    } catch {
      setStatus("JSON 格式不正确，未导入。");
    }
  };

  return (
    <div className="admin-stack">
      <section className="admin-panel">
        <SectionTitle title="数据备份" subtitle="导出或导入的都是本地还原项目数据。" />
        <div className="data-actions">
          <button onClick={() => { setDraft(JSON.stringify(content, null, 2)); setStatus("已刷新当前本地数据。"); }}>刷新当前 JSON</button>
          <button onClick={importDraft}>导入到本地</button>
          <button className="danger-button inline" onClick={onReset}>恢复默认采集内容</button>
        </div>
        <p className="admin-note">{status}</p>
        <textarea className="json-editor" value={draft} onChange={(event) => setDraft(event.target.value)} />
      </section>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="admin-section-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`admin-field ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <Field label={label}>
      <div className={`image-field ${compact ? "compact" : ""}`}>
        <img src={value} alt="" />
        <input list="asset-images" value={value} onChange={(event) => onChange(event.target.value)} />
        <datalist id="asset-images">
          {imageChoices.map((image) => (
            <option key={image} value={image} />
          ))}
        </datalist>
      </div>
    </Field>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function getPageTab(section: AdminSection) {
  const map: Record<AdminSection, string> = {
    dashboard: "首页",
    home: "菜单",
    products: "菜品",
    combo: "套餐",
    mall: "推荐菜单",
    orders: "点餐订单",
    member: "菜品属性",
    data: "支付订单",
  };
  return map[section];
}

function getBreadcrumb(section: AdminSection) {
  const item = adminNav.find((nav) => nav.key === section);
  return item ? `${item.group} / ${item.label}` : "首页";
}

function uniqueName(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  let index = 2;
  while (existing.includes(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function tagsToString(tags: string[]) {
  return tags.join("，");
}

function tagsFromString(value: string) {
  return value
    .split(/[,，\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  return toNumber(value);
}

export default AdminApp;

const SHOP_URL = "https://lifefmtv.squarespace.com/store-1";

const MERCH = [
  {
    id: 1,
    name: "Life FM T-Shirt",
    description: "Classic black tee. Logo front, underground vibes.",
    price: "£25",
    accent: "#e63030",
  },
  {
    id: 2,
    name: "Life FM Hoodie",
    description: "Heavyweight pullover. Stay warm at the rave.",
    price: "£55",
    accent: "#6366f1",
  },
  {
    id: 3,
    name: "Life FM Cap",
    description: "5-panel cap. One size. All day, all night.",
    price: "£20",
    accent: "#22c55e",
  },
  {
    id: 4,
    name: "Limited Edition Tote",
    description: "Recycled canvas. Carry your records in style.",
    price: "£15",
    accent: "#f59e0b",
  },
];

export default function ShopPage() {
  return (
    <main className="content-page">
      <a href="/" className="back-link">← Home</a>
      <h1 className="page-heading">Shop</h1>

      <p className="shop-intro">
        Official Life FM merch. All orders fulfilled through our store.
      </p>

      <div className="shop-grid">
        {MERCH.map((item) => (
          <div key={item.id} className="shop-card">
            <div
              className="shop-card-image"
              style={{ borderTop: `3px solid ${item.accent}` }}
            >
              <div
                className="shop-card-image-inner"
                style={{ background: `${item.accent}12` }}
              >
                <span
                  className="shop-card-image-logo"
                  style={{ color: item.accent }}
                >
                  LFM
                </span>
              </div>
            </div>
            <div className="shop-card-body">
              <p className="shop-card-name">{item.name}</p>
              <p className="shop-card-desc">{item.description}</p>
              <div className="shop-card-footer">
                <span className="shop-card-price">{item.price}</span>
                <a
                  href={SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shop-buy-btn"
                >
                  Buy Now
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="shop-store-link">
        <a
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="shop-view-all-btn"
        >
          View Full Store →
        </a>
      </div>
    </main>
  );
}

import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ClipboardList,
  Fish,
  LogOut,
  MapPinned,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Waves,
  X,
} from 'lucide-react';
import {
  addReview,
  approveEcoReport,
  createCatch,
  createEcoReport,
  createListing,
  createMarketRequest,
  getAnalytics,
  getCatches,
  getEcoReports,
  getMapMarkers,
  getMarket,
  getMarketRequests,
  getPendingEcoReports,
  login,
  register,
  rejectEcoReport,
} from './api';
import { CaspianMap } from './components/CaspianMap';
import {
  ecoStatusLabels,
  ecoTypeLabels,
  fishIcons,
  fishTypes,
  formatKg,
  formatPrice,
  listingLabels,
  marketLabels,
  marketRequestLabels,
  toNumber,
  verificationLabels,
} from './reportMeta';
import type {
  Analytics,
  CatchItem,
  CreateCatchPayload,
  CreateEcoReportPayload,
  CreateMarketRequestPayload,
  EcoReport,
  EcoReportType,
  MapMarker,
  MarketListing,
  MarketRequest,
  User,
} from './types';
import './App.css';

const storageKey = 'caspian-current-user';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as User : null;
  });

  function handleLogin(nextUser: User) {
    localStorage.setItem(storageKey, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem(storageKey);
    setUser(null);
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark"><Waves size={24} /></span>
          <span>
            <strong>Caspian Fish Hub</strong>
            <small>{user.role === 'inspector' ? 'инспектор' : 'рыбак'} · {user.email}</small>
          </span>
        </Link>

        <nav>
          <NavLink to="/">Карта</NavLink>
          {user.role === 'fisherman' ? <NavLink to="/catches">Мой улов</NavLink> : null}
          <NavLink to="/market">Рынок</NavLink>
          <NavLink to="/requests">Заявки</NavLink>
          <NavLink to="/analytics">Аналитика</NavLink>
        </nav>

        <button className="button ghost logout-button" type="button" onClick={logout}>
          <LogOut size={17} /> Выйти
        </button>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/catches" element={<MyCatchesPage user={user} />} />
          <Route path="/market" element={<MarketPage user={user} />} />
          <Route path="/requests" element={<RequestsPage user={user} />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup' && password !== passwordRepeat) {
      setLoading(false);
      setError('Пароли не совпадают.');
      return;
    }

    try {
      const user =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password);
      onLogin(user);
    } catch (requestError) {
      const message =
        requestError &&
        typeof requestError === 'object' &&
        'response' in requestError &&
        requestError.response &&
        typeof requestError.response === 'object' &&
        'data' in requestError.response &&
        requestError.response.data &&
        typeof requestError.response.data === 'object' &&
        'message' in requestError.response.data
          ? String(requestError.response.data.message)
          : 'Не удалось выполнить запрос. Проверьте backend и данные входа.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <span className="brand-mark"><Waves size={28} /></span>
        <div className="section-heading">
          <span className="eyebrow">{mode === 'login' ? 'Вход' : 'Регистрация'}</span>
          <h1>Caspian Fish Hub</h1>
        </div>
        <form className="login-form" onSubmit={submit}>
          <label>Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Введите пароль"
              required
              minLength={6}
            />
          </label>
          {mode === 'signup' ? (
            <label>Повторите пароль
              <input
                type="password"
                value={passwordRepeat}
                onChange={(event) => setPasswordRepeat(event.target.value)}
                placeholder="Повторите пароль"
                required
                minLength={6}
              />
            </label>
          ) : null}
          <button className="button primary" type="submit" disabled={loading}>
            {loading
              ? mode === 'login'
                ? 'Входим...'
                : 'Создаём...'
              : mode === 'login'
                ? 'Войти'
                : 'Создать аккаунт'}
          </button>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
        <p className="auth-switch">
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
          <button
            type="button"
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
          >
            {mode === 'login' ? 'Создать аккаунт' : 'Войти'}
          </button>
        </p>
      </section>
    </main>
  );
}

function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [kind, setKind] = useState('all');

  useEffect(() => {
    getMapMarkers().then(setMarkers);
  }, []);

  const visibleMarkers = kind === 'all' ? markers : markers.filter((marker) => marker.kind === kind);

  return (
    <section className="page-stack">
      <div className="section-heading row-heading">
        <div>
          <span className="eyebrow"><MapPinned size={16} /> Карта Каспия</span>
          <h1>Проверенные точки</h1>
        </div>
        <select className="compact-select" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="all">Все метки</option>
          <option value="catch">Уловы</option>
          <option value="eco">Эко-проблемы</option>
          <option value="risk">Зоны риска</option>
        </select>
      </div>
      <div className="map-panel caspian-map-panel"><CaspianMap markers={visibleMarkers} /></div>
      <div className="legend">
        <span><i className="dot approved" /> Подтверждённый улов</span>
        <span><i className="dot eco" /> Эко-проблема</span>
        <span><i className="dot warning" /> Зона риска</span>
      </div>
    </section>
  );
}

function MyCatchesPage({ user }: { user: User }) {
  const [catches, setCatches] = useState<CatchItem[]>([]);
  const [form, setForm] = useState<CreateCatchPayload>({
    userId: user.id,
    fishType: 'Сазан',
    weight: 25,
    locationName: 'Актау',
    latitude: 43.6511,
    longitude: 51.1975,
    description: '',
    fishImage: '🐟',
  });

  const refresh = () => getCatches(user.id).then(setCatches);

  useEffect(() => {
    refresh();
  }, [user.id]);

  if (user.role === 'inspector') {
    return <EmptyState title="Инспектор не добавляет личный улов" text="Для проверки заявок перейдите во вкладку Заявки." />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createCatch({ ...form, userId: user.id });
    setForm({ ...form, description: '', weight: 25 });
    await refresh();
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <span className="eyebrow"><Fish size={16} /> Личная память рыбака</span>
        <h1>Мой улов</h1>
      </div>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>Вид рыбы
            <select value={form.fishType} onChange={(event) => setForm({ ...form, fishType: event.target.value })}>
              {fishTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Вес, кг
            <input type="number" min="1" value={form.weight} onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })} />
          </label>
          <label>Район / местность
            <input value={form.locationName} onChange={(event) => setForm({ ...form, locationName: event.target.value })} />
          </label>
          <label>Иконка рыбы
            <select value={form.fishImage} onChange={(event) => setForm({ ...form, fishImage: event.target.value })}>
              {fishIcons.map((icon) => <option key={icon}>{icon}</option>)}
            </select>
          </label>
          <label>Latitude
            <input type="number" step="0.000001" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} />
          </label>
          <label>Longitude
            <input type="number" step="0.000001" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} />
          </label>
        </div>
        <label>Описание
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>
        <button className="button primary" type="submit"><Plus size={18} /> Отправить инспектору</button>
      </form>

      <div className="cards-grid">
        {catches.map((item) => <CatchCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

function MarketPage({ user }: { user: User }) {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [myCatches, setMyCatches] = useState<CatchItem[]>([]);
  const [requests, setRequests] = useState<MarketRequest[]>([]);
  const [listingForm, setListingForm] = useState({ catchId: '', price: '' });
  const [review, setReview] = useState<Record<number, { rating: string; comment: string }>>({});
  const [requestForm, setRequestForm] = useState<CreateMarketRequestPayload>({
    requesterEmail: user.email,
    fishType: 'Сазан',
    weight: 15,
    deadline: '2026-06-20',
    offeredPrice: 42000,
    locationName: 'Актау',
    description: '',
  });

  const refresh = async () => {
    const [market, marketRequests] = await Promise.all([getMarket(), getMarketRequests()]);
    setListings(market);
    setRequests(marketRequests);
    if (user.role === 'fisherman') {
      setMyCatches(await getCatches(user.id));
    }
  };

  useEffect(() => {
    refresh();
  }, [user.id, user.role]);

  const eligibleCatches = myCatches.filter((item) => item.verificationStatus === 'approved' && item.marketStatus === 'not_listed');

  async function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createListing(Number(listingForm.catchId), user.id, Number(listingForm.price));
    setListingForm({ catchId: '', price: '' });
    await refresh();
  }

  async function submitReview(listing: MarketListing) {
    const value = review[listing.id] || { rating: '5', comment: '' };
    await addReview(listing.id, {
      sellerId: listing.sellerId,
      reviewerEmail: user.email,
      rating: Number(value.rating),
      comment: value.comment || 'Хороший продавец',
    });
    await refresh();
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createMarketRequest({ ...requestForm, requesterEmail: user.email });
    setRequestForm({ ...requestForm, description: '' });
    await refresh();
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <span className="eyebrow"><ShoppingBag size={16} /> Продажа и спрос</span>
        <h1>Рынок</h1>
      </div>

      {user.role === 'fisherman' ? (
        <form className="form-card" onSubmit={submitListing}>
          <h2>Создать слот продажи</h2>
          <div className="form-grid">
            <label>Подтверждённый улов
              <select value={listingForm.catchId} onChange={(event) => setListingForm({ ...listingForm, catchId: event.target.value })} required>
                <option value="">Выберите улов</option>
                {eligibleCatches.map((item) => <option key={item.id} value={item.id}>{item.fishType} · {formatKg(item.weight)} · {item.locationName}</option>)}
              </select>
            </label>
            <label>Цена, ₸
              <input type="number" value={listingForm.price} onChange={(event) => setListingForm({ ...listingForm, price: event.target.value })} required />
            </label>
          </div>
          <button className="button primary" type="submit"><Plus size={18} /> Выставить на рынок</button>
        </form>
      ) : null}

      <form className="form-card" onSubmit={submitRequest}>
        <h2>Создать запрос на рынке</h2>
        <div className="form-grid">
          <label>Какая рыба нужна
            <select value={requestForm.fishType} onChange={(event) => setRequestForm({ ...requestForm, fishType: event.target.value })}>{fishTypes.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label>Сколько кг
            <input type="number" value={requestForm.weight} onChange={(event) => setRequestForm({ ...requestForm, weight: Number(event.target.value) })} />
          </label>
          <label>Срок
            <input type="date" value={requestForm.deadline} onChange={(event) => setRequestForm({ ...requestForm, deadline: event.target.value })} />
          </label>
          <label>Цена, ₸
            <input type="number" value={requestForm.offeredPrice} onChange={(event) => setRequestForm({ ...requestForm, offeredPrice: Number(event.target.value) })} />
          </label>
          <label>Район
            <input value={requestForm.locationName} onChange={(event) => setRequestForm({ ...requestForm, locationName: event.target.value })} />
          </label>
        </div>
        <label>Описание
          <textarea value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} required />
        </label>
        <button className="button ghost" type="submit"><Plus size={18} /> Создать запрос</button>
      </form>

      <div className="cards-grid">
        {listings.map((listing) => (
          <article className="report-card product-card" key={listing.id}>
            <div className="report-card-header">
              <span className="type-pill">{listing.catch.fishImage} {listing.catch.fishType}</span>
              <span className="status-pill approved">{listingLabels[listing.status]}</span>
            </div>
            <h2>{formatPrice(listing.price)}</h2>
            <p>{formatKg(listing.catch.weight)} · {listing.catch.locationName}</p>
            <div className="seller-row">
              <span>{listing.seller.email}</span>
              <strong><Star size={15} /> {toNumber(listing.sellerRating).toFixed(1)}</strong>
            </div>
            <div className="review-box">
              <select value={review[listing.id]?.rating || '5'} onChange={(event) => setReview({ ...review, [listing.id]: { rating: event.target.value, comment: review[listing.id]?.comment || '' } })}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating}>{rating}</option>)}
              </select>
              <input placeholder="Короткий отзыв" value={review[listing.id]?.comment || ''} onChange={(event) => setReview({ ...review, [listing.id]: { rating: review[listing.id]?.rating || '5', comment: event.target.value } })} />
              <button className="button ghost" type="button" onClick={() => submitReview(listing)}>Оценить</button>
            </div>
          </article>
        ))}
      </div>

      <div className="cards-grid">
        {requests.map((item) => (
          <article className="report-card" key={item.id}>
            <span className="type-pill">{marketRequestLabels[item.status]}</span>
            <h2>{item.fishType} · {formatKg(item.weight)}</h2>
            <p>{item.description}</p>
            <div className="report-meta"><span>{formatPrice(item.offeredPrice)}</span><span>{item.locationName}</span><span>до {item.deadline}</span></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RequestsPage({ user }: { user: User }) {
  return user.role === 'inspector' ? <InspectorRequestsPage /> : <FishermanRequestsPage user={user} />;
}

function FishermanRequestsPage({ user }: { user: User }) {
  const [reports, setReports] = useState<EcoReport[]>([]);
  const [form, setForm] = useState<CreateEcoReportPayload>({
    userId: user.id,
    type: 'pollution',
    title: '',
    description: '',
    latitude: 43.6511,
    longitude: 51.1975,
    locationName: 'Актау',
  });

  const refresh = () => getEcoReports().then(setReports);

  useEffect(() => {
    refresh();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createEcoReport({ ...form, userId: user.id });
    setForm({ ...form, title: '', description: '' });
    await refresh();
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <span className="eyebrow"><AlertTriangle size={16} /> Экологические жалобы</span>
        <h1>Заявки</h1>
      </div>
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <label>Тип
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as EcoReportType })}>
              {Object.entries(ecoTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Название
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </label>
          <label>Место
            <input value={form.locationName} onChange={(event) => setForm({ ...form, locationName: event.target.value })} />
          </label>
          <label>Latitude
            <input type="number" step="0.000001" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} />
          </label>
          <label>Longitude
            <input type="number" step="0.000001" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} />
          </label>
        </div>
        <label>Описание
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>
        <button className="button primary" type="submit"><Plus size={18} /> Отправить инспектору</button>
      </form>
      <div className="cards-grid">
        {reports.map((item) => <EcoReportCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}

function InspectorRequestsPage() {
  const [reports, setReports] = useState<EcoReport[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});

  const refresh = async () => {
    setReports(await getPendingEcoReports());
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section className="page-stack">
      <div className="section-heading">
        <span className="eyebrow"><ShieldCheck size={16} /> Проверка инспектора</span>
        <h1>Заявки</h1>
      </div>
      <div className="card">
        <h2>Эко-жалобы на проверке</h2>
        <div className="report-list compact">
          {reports.map((item) => {
            const key = `eco-${item.id}`;
            return (
              <EcoReportCard key={item.id} item={item}>
                <ReviewActions
                  value={comments[key] || ''}
                  onChange={(value) => setComments({ ...comments, [key]: value })}
                  onApprove={async () => { await approveEcoReport(item.id, comments[key] || 'Местность грязная, требуется проверка.'); await refresh(); }}
                  onReject={async () => { await rejectEcoReport(item.id, comments[key] || 'Заявка отклонена.'); await refresh(); }}
                />
              </EcoReportCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  useEffect(() => {
    getAnalytics().then(setAnalytics);
  }, []);

  if (!analytics) return <div className="loading page-loading">Загрузка аналитики...</div>;

  return (
    <section className="page-stack">
      <div className="section-heading">
        <span className="eyebrow"><BarChart3 size={16} /> Аналитика Каспия</span>
        <h1>Нагрузка: {analytics.caspianLoad}</h1>
      </div>
      <div className="metric-row">
        <MetricCard label="Подтверждённый улов, кг" value={analytics.totalApprovedWeight} icon={<Fish />} />
        <MetricCard label="Подтверждённых уловов" value={analytics.approvedCount} icon={<Check />} />
        <MetricCard label="Pending уловов" value={analytics.pendingCount} icon={<ShieldCheck />} />
        <MetricCard label="Эко-заявок" value={analytics.ecoReportsCount} icon={<AlertTriangle />} />
        <MetricCard label="Подтверждённых проблем" value={analytics.approvedEcoReportsCount} icon={<ClipboardList />} />
      </div>
      <div className="dashboard-grid">
        <AnalyticsBars title="Топ видов рыбы" items={analytics.topFishTypes} />
        <AnalyticsBars title="Районы с большим уловом" items={analytics.topLocations} />
        <AnalyticsBars title="Районы с жалобами" items={analytics.topComplaintLocations} />
        <div className="card">
          <h2>Примерная аналитика по районам</h2>
          <div className="bars">
            {analytics.areaInsights.map((item) => <p key={item.name}><b>{item.name}:</b> {item.text}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function CatchCard({ item, children }: { item: CatchItem; children?: ReactElement | null }) {
  return (
    <article className="report-card fish-card">
      <div className="fish-icon">{item.fishImage || '🐟'}</div>
      <div className="report-card-header">
        <span className="type-pill">{item.fishType}</span>
        <span className={`status-pill ${item.verificationStatus}`}>{verificationLabels[item.verificationStatus]}</span>
      </div>
      <h2>{formatKg(item.weight)}</h2>
      <p>{item.description}</p>
      <div className="report-meta">
        <span>{item.locationName}</span>
        <span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
        <span>{marketLabels[item.marketStatus]}</span>
      </div>
      {item.inspectorComment ? <p className="inspector-comment">{item.inspectorComment}</p> : null}
      {children}
    </article>
  );
}

function EcoReportCard({ item, children }: { item: EcoReport; children?: ReactElement | null }) {
  return (
    <article className="report-card">
      <div className="report-card-header">
        <span className="type-pill">{ecoTypeLabels[item.type]}</span>
        <span className={`status-pill ${item.status}`}>{ecoStatusLabels[item.status]}</span>
      </div>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      <div className="report-meta"><span>{item.locationName}</span><span>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span></div>
      {item.inspectorComment ? <p className="inspector-comment">{item.inspectorComment}</p> : null}
      {children}
    </article>
  );
}

function ReviewActions({ value, onChange, onApprove, onReject }: { value: string; onChange: (value: string) => void; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="review-actions">
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Официальный комментарий инспектора" />
      <div className="inline-action">
        <button className="button primary" type="button" onClick={onApprove}><Check size={18} /> Подтвердить</button>
        <button className="button danger" type="button" onClick={onReject}><X size={18} /> Отклонить</button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactElement }) {
  return (
    <div className="metric-card">
      <span>{icon}</span>
      <div>
        <strong>{value.toLocaleString('ru-RU')}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function AnalyticsBars({ title, items }: { title: string; items: Array<{ name: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="bars">
        {items.map((item) => (
          <div className="bar-row" key={item.name}>
            <span>{item.name}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} /></div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="page-stack">
      <div className="page-loading">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  );
}

export default App;

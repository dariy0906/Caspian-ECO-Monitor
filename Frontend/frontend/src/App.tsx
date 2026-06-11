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
  removeListing,
  removeMarketRequest,
  updateMapMarkerNote,
} from './api';
import { CaspianMap } from './components/CaspianMap';
import {
  ecoStatusLabels,
  ecoTypeLabels,
  fishTypes,
  formatKg,
  formatPrice,
  listingLabels,
  marketLabels,
  marketRequestLabels,
  toNumber,
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
          <Route path="/" element={<MapPage user={user} />} />
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

function MapPage({ user }: { user: User }) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [kind, setKind] = useState('all');
  const refresh = async () => {
    setMarkers(await getMapMarkers());
  };

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleMarkerNote(markerId: string, action: 'add_plus' | 'add_minus' | 'remove_plus' | 'remove_minus', text: string) {
    await updateMapMarkerNote(markerId, action, text);
    await refresh();
  }

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
      <div className="map-panel caspian-map-panel">
        <CaspianMap
          markers={visibleMarkers}
          canEditNotes={user.role === 'inspector'}
          onMarkerNote={handleMarkerNote}
        />
      </div>
      <div className="legend">
        <span><i className="dot approved" /> Рыбная точка до 100 кг</span>
        <span><i className="dot medium" /> 100-300 кг</span>
        <span><i className="dot high" /> Более 300 кг</span>
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
          <label>Широта
            <input type="number" step="0.000001" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} />
          </label>
          <label>Долгота
            <input type="number" step="0.000001" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} />
          </label>
        </div>
        <label>Описание
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>
        <button className="button primary" type="submit"><Plus size={18} /> Добавить</button>
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

  async function deleteListing(id: number) {
    await removeListing(id);
    await refresh();
  }

  async function deleteRequest(id: number) {
    await removeMarketRequest(id);
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
            <label>Улов для продажи
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

      {user.role === 'fisherman' ? (
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
      ) : null}

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
              {user.role === 'inspector' ? (
                <button className="button danger" type="button" onClick={() => deleteListing(listing.id)}>Убрать товар</button>
              ) : (
                <>
                  <select value={review[listing.id]?.rating || '5'} onChange={(event) => setReview({ ...review, [listing.id]: { rating: event.target.value, comment: review[listing.id]?.comment || '' } })}>
                    {[5, 4, 3, 2, 1].map((rating) => <option key={rating}>{rating}</option>)}
                  </select>
                  <input placeholder="Короткий отзыв" value={review[listing.id]?.comment || ''} onChange={(event) => setReview({ ...review, [listing.id]: { rating: review[listing.id]?.rating || '5', comment: event.target.value } })} />
                  <button className="button ghost" type="button" onClick={() => submitReview(listing)}>Оценить</button>
                </>
              )}
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
            {user.role === 'inspector' ? (
              <button className="button danger" type="button" onClick={() => deleteRequest(item.id)}>Убрать запрос</button>
            ) : null}
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
          <label>Широта
            <input type="number" step="0.000001" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: Number(event.target.value) })} />
          </label>
          <label>Долгота
            <input type="number" step="0.000001" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: Number(event.target.value) })} />
          </label>
        </div>
        <label>Описание
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>
        <button className="button primary" type="submit"><Plus size={18} /> Добавить заявку</button>
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
  const [selectedYear, setSelectedYear] = useState<'current' | 'previous'>('current');
  useEffect(() => {
    const refresh = () => getAnalytics().then(setAnalytics);
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, []);

  if (!analytics) return <div className="loading page-loading">Загрузка аналитики...</div>;

  const showingCurrent = selectedYear === 'current';
  const activeYear = showingCurrent ? analytics.currentYear : analytics.previousYear;
  const selectedOverview = showingCurrent
    ? analytics.overview
    : {
        ...analytics.overview,
        totalCatches: analytics.yearSummary.catches.previous,
        totalApprovedWeight: analytics.yearSummary.weight.previous,
        ecoComplaints: analytics.yearSummary.complaints.previous,
      };

  return (
    <section className="analytics-page">
      <div className="analytics-container">
      <div className="dashboard-hero">
        <div className="section-heading">
          <span className="eyebrow"><BarChart3 size={16} /> Аналитика</span>
          <h1>Аналитика рыбной отрасли Каспия</h1>
          <p>Ключевые показатели уловов, рынка и экологических жалоб за {activeYear} год.</p>
        </div>
        <div className="year-toggle" aria-label="Переключатель года">
          <button className={showingCurrent ? 'active' : ''} type="button" onClick={() => setSelectedYear('current')}>
            Текущий год
          </button>
          <button className={!showingCurrent ? 'active' : ''} type="button" onClick={() => setSelectedYear('previous')}>
            Прошлый год
          </button>
        </div>
      </div>

      <div className="year-comparison">
        <YearMetricCard
          icon={<Fish />}
          label="Уловов"
          currentYear={analytics.currentYear}
          previousYear={analytics.previousYear}
          metric={analytics.yearSummary.catches}
        />
        <YearMetricCard
          icon={<Waves />}
          label="Общий вес"
          suffix=" кг"
          currentYear={analytics.currentYear}
          previousYear={analytics.previousYear}
          metric={analytics.yearSummary.weight}
        />
        <YearMetricCard
          icon={<AlertTriangle />}
          label="Жалобы"
          currentYear={analytics.currentYear}
          previousYear={analytics.previousYear}
          metric={analytics.yearSummary.complaints}
        />
      </div>

      <div className="stats-grid">
        <MetricCard label="Всего уловов" value={selectedOverview.totalCatches} icon={<Fish />} />
        <MetricCard label="Общий вес улова, кг" value={Math.round(selectedOverview.totalApprovedWeight)} icon={<Waves />} />
        <MetricCard label="Активных объявлений" value={selectedOverview.activeListings} icon={<ShoppingBag />} />
        <MetricCard label="Активных заявок" value={selectedOverview.activeRequests} icon={<ClipboardList />} />
        <MetricCard label="Экологических жалоб" value={selectedOverview.ecoComplaints} icon={<AlertTriangle />} />
        <MetricCard label="Районов мониторинга" value={selectedOverview.monitoringAreas} icon={<MapPinned />} />
      </div>

      <div className="dashboard-grid wide-dashboard-grid">
        <MonthlyCatchChart items={analytics.monthlyCatch} selectedYear={selectedYear} />
        <FishBreakdown items={analytics.fishBreakdown} />
        <div className={`ecosystem-card card ${analytics.ecosystem.tone}`}>
          <div>
            <span className="eyebrow"><Waves size={16} /> Состояние экосистемы</span>
            <h2>{analytics.ecosystem.label}</h2>
            <p>{analytics.ecosystem.description}</p>
          </div>
          <div className="eco-status-scale">
            <span className={analytics.ecosystem.tone === 'good' ? 'active good' : 'good'}>Хорошее</span>
            <span className={analytics.ecosystem.tone === 'warning' ? 'active warning' : 'warning'}>Внимание</span>
            <span className={analytics.ecosystem.tone === 'danger' ? 'active danger' : 'danger'}>Нагрузка</span>
          </div>
          <div className="eco-breakdown">
            {analytics.ecoBreakdown.map((item) => (
              <div key={item.type}>
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <LocationBreakdown items={analytics.locationBreakdown} currentYear={analytics.currentYear} previousYear={analytics.previousYear} />
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

function YearMetricCard({
  label,
  metric,
  icon,
  currentYear,
  previousYear,
  suffix = '',
}: {
  label: string;
  metric: { current: number; previous: number; change: number };
  icon: ReactElement;
  currentYear: number;
  previousYear: number;
  suffix?: string;
}) {
  const positive = metric.change >= 0;
  return (
    <article className="year-card">
      <span className="year-card-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{Math.round(metric.current).toLocaleString('ru-RU')}{suffix}</strong>
        <p>{currentYear}: {Math.round(metric.current).toLocaleString('ru-RU')}{suffix}</p>
        <p>{previousYear}: {Math.round(metric.previous).toLocaleString('ru-RU')}{suffix}</p>
      </div>
      <b className={positive ? 'trend up' : 'trend down'}>
        {positive ? '↑' : '↓'} {positive ? '+' : ''}{metric.change}%
      </b>
    </article>
  );
}

function MonthlyCatchChart({ items, selectedYear }: { items: Array<{ month: string; current: number; previous: number }>; selectedYear: 'current' | 'previous' }) {
  const max = Math.max(...items.flatMap((item) => [item.current, item.previous]), 1);
  return (
    <div className="card chart-card monthly-chart-card">
      <div className="card-heading-row">
        <div>
          <h2>Улов по месяцам</h2>
          <p>Сравнение текущего и прошлого года</p>
        </div>
        <span>{selectedYear === 'current' ? 'Текущий год' : 'Прошлый год'}</span>
      </div>
      <div className="month-chart">
        {items.map((item) => (
          <div className="month-column" key={item.month}>
            <div className="month-bars">
              <span className="month-bar previous" style={{ height: `${Math.max((item.previous / max) * 100, 6)}%` }} />
              <span className="month-bar current" style={{ height: `${Math.max((item.current / max) * 100, 6)}%` }} />
            </div>
            <small>{item.month}</small>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span><i className="legend-dot current" />Текущий год</span>
        <span><i className="legend-dot previous" />Прошлый год</span>
      </div>
    </div>
  );
}

function FishBreakdown({ items }: { items: Array<{ name: string; value: number; percent: number }> }) {
  return (
    <div className="card chart-card top-fish-card">
      <h2>Топ видов рыб</h2>
      <div className="bars">
        {items.map((item) => (
          <div className="dashboard-bar-row" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <span>{Math.round(item.value)} кг · {item.percent}%</span>
            </div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${item.percent}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationBreakdown({
  items,
  currentYear,
  previousYear,
}: {
  items: Array<{ name: string; count: number; weight: number; previousWeight: number; change: number; topFish: string }>;
  currentYear: number;
  previousYear: number;
}) {
  const max = Math.max(...items.map((item) => item.weight), 1);
  return (
    <div className="card chart-card districts-card">
      <h2>Рыбная активность по районам</h2>
      <div className="location-list">
        {items.map((item) => (
          <div className="location-row" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.count} уловов · топ рыба: {item.topFish}</span>
            </div>
            <div className="district-year-row">
              <span>{currentYear}: {Math.round(item.weight)} кг</span>
              <span>{previousYear}: {Math.round(item.previousWeight)} кг</span>
              <b className={item.change >= 0 ? 'trend up' : 'trend down'}>
                {item.change >= 0 ? '↑ +' : '↓ '}{item.change}%
              </b>
            </div>
            <div className="bar-track"><div className="bar-fill alt" style={{ width: `${(item.weight / max) * 100}%` }} /></div>
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

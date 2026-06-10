export type UserRole = 'fisherman' | 'inspector';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type MarketStatus = 'not_listed' | 'listed' | 'sold';
export type ListingStatus = 'active' | 'sold' | 'cancelled';
export type EcoReportType = 'pollution' | 'trash' | 'dead_fish' | 'illegal_nets';
export type EcoReportStatus = 'pending' | 'approved' | 'rejected';
export type MarketRequestStatus = 'open' | 'accepted' | 'completed';

export type User = {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type CatchItem = {
  id: number;
  userId: number;
  user: User;
  fishType: string;
  weight: number | string;
  locationName: string;
  latitude: number | string;
  longitude: number | string;
  description: string;
  fishImage: string;
  verificationStatus: VerificationStatus;
  marketStatus: MarketStatus;
  createdAt: string;
  approvedAt: string | null;
  inspectorComment: string | null;
};

export type MarketListing = {
  id: number;
  catchId: number;
  catch: CatchItem;
  sellerId: number;
  seller: User;
  sellerRating: number;
  price: number | string;
  status: ListingStatus;
  reviews: SellerReview[];
  createdAt: string;
};

export type SellerReview = {
  id: number;
  sellerId: number;
  reviewerEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type MarketRequest = {
  id: number;
  requesterEmail: string;
  fishType: string;
  weight: number | string;
  deadline: string;
  offeredPrice: number | string;
  locationName: string;
  description: string;
  status: MarketRequestStatus;
  createdAt: string;
};

export type EcoReport = {
  id: number;
  userId: number;
  user: User;
  type: EcoReportType;
  title: string;
  description: string;
  latitude: number | string;
  longitude: number | string;
  locationName: string;
  status: EcoReportStatus;
  inspectorComment: string | null;
  createdAt: string;
  approvedAt: string | null;
};

export type MapMarker = {
  id: string;
  kind: 'catch' | 'eco' | 'risk';
  title: string;
  markerType: string;
  latitude: number | string;
  longitude: number | string;
  pluses: string[];
  minuses: string[];
  description: string;
};

export type Analytics = {
  totalApprovedWeight: number;
  approvedCount: number;
  pendingCount: number;
  ecoReportsCount: number;
  approvedEcoReportsCount: number;
  topFishTypes: Array<{ name: string; value: number }>;
  topLocations: Array<{ name: string; value: number }>;
  topComplaintLocations: Array<{ name: string; value: number }>;
  caspianLoad: 'низкая' | 'средняя' | 'высокая';
  areaInsights: Array<{ name: string; text: string }>;
  currentYear: number;
  previousYear: number;
  yearSummary: {
    catches: { current: number; previous: number; change: number };
    weight: { current: number; previous: number; change: number };
    complaints: { current: number; previous: number; change: number };
  };
  overview: {
    totalCatches: number;
    totalApprovedWeight: number;
    activeListings: number;
    activeRequests: number;
    ecoComplaints: number;
    monitoringAreas: number;
  };
  monthlyCatch: Array<{ month: string; current: number; previous: number }>;
  fishBreakdown: Array<{ name: string; value: number; percent: number }>;
  locationBreakdown: Array<{ name: string; count: number; weight: number }>;
  ecoBreakdown: Array<{ type: EcoReportType; label: string; count: number }>;
  ecosystem: {
    status: 'хорошее' | 'attention' | 'high';
    label: string;
    tone: 'good' | 'warning' | 'danger';
    description: string;
  };
  recommendations: string[];
};

export type CreateCatchPayload = {
  userId: number;
  fishType: string;
  weight: number;
  locationName: string;
  latitude: number;
  longitude: number;
  description: string;
  fishImage: string;
};

export type CreateMarketRequestPayload = {
  requesterEmail: string;
  fishType: string;
  weight: number;
  deadline: string;
  offeredPrice: number;
  locationName: string;
  description: string;
};

export type CreateEcoReportPayload = {
  userId: number;
  type: EcoReportType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
};

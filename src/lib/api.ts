// API client for Farm-Guru backend integration
export interface QueryRequest {
  user_id?: string;
  text: string;
  lang: 'en' | 'hi';
  image_id?: string;
}

export interface QueryResponse {
  answer: string;
  confidence: number;
  actions: string[];
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export interface WeatherResponse {
  forecast: {
    temperature: number;
    humidity: number;
    rainfall: number;
    description: string;
  };
  recommendation: string;
}

export interface MarketResponse {
  commodity: string;
  latest_price: number;
  "7d_ma": number;
  signal: "BUY" | "HOLD" | "SELL";
  history: Array<{
    date: string;
    price: number;
  }>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  async query(request: QueryRequest): Promise<QueryResponse> {
    const response = await fetch(`${this.baseUrl}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Query failed');
    }

    return response.json();
  }

  async getWeather(state: string, district: string): Promise<WeatherResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/weather?state=${state}&district=${district}`
    );

    if (!response.ok) {
      throw new Error('Weather fetch failed');
    }

    return response.json();
  }

  async getMarketData(commodity: string, mandi: string): Promise<MarketResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/market?commodity=${commodity}&mandi=${mandi}`
    );

    if (!response.ok) {
      throw new Error('Market data fetch failed');
    }

    return response.json();
  }

  async uploadImage(file: File): Promise<{ image_id: string; url: string; label: string; confidence: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
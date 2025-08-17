import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/i18n';
import { analytics } from '@/lib/analytics';
import pricesData from '@/data/prices.json';

const MarketPage = () => {
  const [selectedCommodity, setSelectedCommodity] = useState('tomato');
  const [selectedMandi, setSelectedMandi] = useState('Bengaluru');
  const { t, language } = useTranslation();

  const commodities = [
    { value: 'tomato', label: language === 'en' ? 'Tomato' : 'टमाटर' },
    { value: 'wheat', label: language === 'en' ? 'Wheat' : 'गेहूं' },
    { value: 'rice', label: language === 'en' ? 'Rice' : 'चावल' }
  ];

  const mandis = [
    'Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const currentData = pricesData[selectedCommodity as keyof typeof pricesData];
  const latestPrice = currentData[currentData.length - 1]?.price || 0;
  const previousPrice = currentData[currentData.length - 2]?.price || 0;
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = previousPrice ? ((priceChange / previousPrice) * 100) : 0;

  // Calculate 7-day average
  const sevenDayAverage = currentData.reduce((sum, item) => sum + item.price, 0) / currentData.length;

  // Generate trading signal
  const getSignal = () => {
    if (latestPrice > sevenDayAverage * 1.05) return 'SELL';
    if (latestPrice < sevenDayAverage * 0.95) return 'BUY';
    return 'HOLD';
  };

  const signal = getSignal();

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'text-success border-success';
      case 'SELL': return 'text-destructive border-destructive';
      default: return 'text-warning border-warning';
    }
  };

  const getSignalBg = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-success/10';
      case 'SELL': return 'bg-destructive/10';
      default: return 'bg-warning/10';
    }
  };

  useEffect(() => {
    analytics.featureUsed('market_data_view');
  }, [selectedCommodity, selectedMandi]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-foreground flex items-center justify-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-warning" />
            {t('commodityPrices')}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en' 
              ? 'Track real-time commodity prices and get trading signals for better market decisions'
              : 'बेहतर बाजार निर्णयों के लिए रियल-टाइम कमोडिटी की कीमतों को ट्रैक करें और ट्रेडिंग सिग्नल प्राप्त करें'
            }
          </p>
        </div>

        {/* Controls */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'en' ? 'Commodity' : 'कमोडिटी'}
                </label>
                <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commodities.map(commodity => (
                      <SelectItem key={commodity.value} value={commodity.value}>
                        {commodity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'en' ? 'Mandi' : 'मंडी'}
                </label>
                <Select value={selectedMandi} onValueChange={setSelectedMandi}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mandis.map(mandi => (
                      <SelectItem key={mandi} value={mandi}>{mandi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold mb-1 text-foreground">
                ₹{latestPrice.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                {language === 'en' ? 'Current Price' : 'वर्तमान मूल्य'}
              </div>
              <div className={`flex items-center justify-center gap-1 text-sm ${
                priceChange >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {priceChange >= 0 ? (
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4" />
                )}
                <span>₹{Math.abs(priceChange)}</span>
                <span>({priceChangePercent.toFixed(1)}%)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold mb-1 text-accent-dark">
                ₹{Math.round(sevenDayAverage).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'en' ? '7-Day Average' : '7-दिन औसत'}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold mb-1 text-success">
                ₹{Math.min(...currentData.map(d => d.price)).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'en' ? '7-Day Low' : '7-दिन कम'}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold mb-1 text-destructive">
                ₹{Math.max(...currentData.map(d => d.price)).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {language === 'en' ? '7-Day High' : '7-दिन उच्च'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Signal */}
        <Card className={`glass-card border-2 ${getSignalColor(signal).split(' ')[1]} ${getSignalBg(signal)}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-radius-lg ${getSignalBg(signal)}`}>
                  <ChartBarIcon className={`w-6 h-6 ${getSignalColor(signal).split(' ')[0]}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {language === 'en' ? 'Trading Signal' : 'ट्रेडिंग सिग्नल'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Based on 7-day price analysis' : '7-दिन मूल्य विश्लेषण के आधार पर'}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={`text-lg px-4 py-2 ${getSignalColor(signal)}`}>
                {signal}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Price Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              {t('priceChart')} - {commodities.find(c => c.value === selectedCommodity)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--card-foreground))'
                    }}
                    formatter={(value: any) => [`₹${value}`, 'Price']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Market Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Market Insights' : 'बाजार अंतर्दृष्टि'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <ArrowRightIcon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    {language === 'en' ? 'Price Trend' : 'मूल्य प्रवृत्ति'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {priceChange >= 0 
                      ? (language === 'en' ? 'Prices are trending upward' : 'कीमतें ऊपर की ओर बढ़ रही हैं')
                      : (language === 'en' ? 'Prices are declining' : 'कीमतें गिर रही हैं')
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <ArrowRightIcon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    {language === 'en' ? 'Volatility' : 'अस्थिरता'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.abs(priceChangePercent) > 5 
                      ? (language === 'en' ? 'High volatility detected' : 'उच्च अस्थिरता का पता चला')
                      : (language === 'en' ? 'Normal market conditions' : 'सामान्य बाजार स्थितियां')
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Recommendations' : 'सिफारिशें'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {signal === 'BUY' && (
                <div className="p-3 bg-success/10 rounded-radius border border-success/20">
                  <p className="text-sm text-success font-medium">
                    {language === 'en' 
                      ? 'Consider holding your produce for better prices'
                      : 'बेहतर कीमतों के लिए अपनी उपज को रोकने पर विचार करें'
                    }
                  </p>
                </div>
              )}
              
              {signal === 'SELL' && (
                <div className="p-3 bg-destructive/10 rounded-radius border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">
                    {language === 'en' 
                      ? 'Good time to sell, prices are above average'
                      : 'बेचने का अच्छा समय, कीमतें औसत से ऊपर हैं'
                    }
                  </p>
                </div>
              )}
              
              {signal === 'HOLD' && (
                <div className="p-3 bg-warning/10 rounded-radius border border-warning/20">
                  <p className="text-sm text-warning font-medium">
                    {language === 'en' 
                      ? 'Monitor market closely for the next few days'
                      : 'अगले कुछ दिनों के लिए बाजार की बारीकी से निगरानी करें'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default MarketPage;
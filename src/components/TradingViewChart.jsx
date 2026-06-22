import React, { useEffect, useRef, memo } from 'react';

function TradingViewChart() {
  const container = useRef();

  useEffect(() => {
    // Prevent multiple script injections in strict mode
    if (container.current && container.current.querySelector("script")) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "BINANCE:PAXGUSDT",
        "interval": "1",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(20, 25, 35, 0)",
        "gridColor": "rgba(255, 255, 255, 0.06)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "container_id": "tradingview_chart",
        "support_host": "https://www.tradingview.com"
      }`;
    
    if (container.current) {
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ flex: 1, minHeight: "var(--chart-height, 450px)", width: "100%", marginTop: "20px", borderRadius: "12px", overflow: "hidden", display: 'flex', flexDirection: 'column' }}>
      <div className="tradingview-widget-container__widget" style={{ flex: 1, width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewChart);

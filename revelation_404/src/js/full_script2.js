        document.addEventListener("DOMContentLoaded", async function() {
            // Removed mobile focus scroll block which caused UI layout breaks and header hiding
            window.updateAdPosition = async function(level) {
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                    try {
                        const AdMob = window.Capacitor.Plugins.AdMob;
                        await AdMob.removeBanner().catch(e => {}); // safe remove
                        const pos = (level >= 4) ? 'TOP_CENTER' : 'BOTTOM_CENTER';
                        
                        const appContainer = document.getElementById('appContainer');
                        if (appContainer) {
                            if (level >= 4) {
                                appContainer.style.paddingTop = '90px';
                                appContainer.style.paddingBottom = '40px'; // Ensure space for Android navigation bar
                            } else {
                                appContainer.style.paddingTop = '0px';
                                appContainer.style.paddingBottom = '70px'; // Restore default bottom padding for bottom ad
                            }
                        }

                        const options = {
                            adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner ID
                            margin: 0,
                            isTesting: false,
                            adSize: 'ADAPTIVE_BANNER',
                            position: pos
                        };
                        await AdMob.showBanner(options);
                        console.log(`[Monetization] AdMob banner moved to ${pos}`);
                    } catch (e) {
                        console.error("[Monetization] AdMob Position Update Error:", e);
                    }
                }
            };

            const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

            if (isNative) {
                // [APP] Capacitor Native Environment: Use AdMob & Setup Hardware Back Button
                console.log("[Monetization] Native environment detected. Initializing AdMob...");
                
                try {
                    if (window.Capacitor.Plugins.App) {
                        window.Capacitor.Plugins.App.addListener('backButton', () => {
                            const appContainer = document.getElementById('appContainer');
                            if (appContainer && appContainer.style.display !== 'none') {
                                if (typeof goHome === 'function') goHome();
                            } else {
                                window.Capacitor.Plugins.App.exitApp();
                            }
                        });
                        console.log("[Mobile] Hardware back button intercepted.");
                    }
                } catch (err) {
                    console.error("[Mobile] Back button setup failed", err);
                }

                try {
                    // Try to initialize AdMob via Capacitor plugins
                    if (window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                        const AdMob = window.Capacitor.Plugins.AdMob;
                        await AdMob.initialize();
                        
                        // Set initial ad position based on currentLevel
                        updateAdPosition(typeof currentLevel !== 'undefined' ? currentLevel : 1);
                    } else {
                        console.warn("[Monetization] AdMob plugin not found.");
                    }
                } catch (e) {
                    console.error("[Monetization] AdMob Error:", e);
                }
            } else {
                // [WEB] Web Environment: Use AdSense
                console.log("[Monetization] Web environment detected. Initializing AdSense...");
                const adsenseContainer = document.getElementById('adsense-container');
                if (adsenseContainer) {
                    adsenseContainer.style.display = 'block';
                    adsenseContainer.innerHTML = `
                        <ins class="adsbygoogle"
                             style="display:inline-block;width:320px;height:50px"
                             data-ad-client="ca-pub-7902247777992049"
                             data-ad-slot="1234567890"></ins>
                    `;
                    
                    const script = document.createElement('script');
                    script.async = true;
                    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7902247777992049";
                    script.crossOrigin = "anonymous";
                    document.head.appendChild(script);

                    const inlineScript = document.createElement('script');
                    inlineScript.textContent = "(adsbygoogle = window.adsbygoogle || []).push({});";
                    document.body.appendChild(inlineScript);
                }
            }
        });

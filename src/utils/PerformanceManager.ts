// 實用的性能管理器 - 簡化版本

export interface PerformanceConfig {
    level: 'minimal' | 'basic' | 'enhanced' | 'full';
    maxFPS: number;
    enableComplexAnimations: boolean;
    enableParticleEffects: boolean;
    enableAdvancedEffects: boolean;
}

export class PerformanceManager {
    private static instance: PerformanceManager;
    private config: PerformanceConfig;
    private fpsMonitor: FPSMonitor;
    private isPowerSaveMode: boolean = false;
    private performanceIndicator: PerformanceIndicator;

    private constructor() {
        this.fpsMonitor = new FPSMonitor();
        this.performanceIndicator = new PerformanceIndicator();
        this.config = this.detectInitialConfig();
    }

    static getInstance(): PerformanceManager {
        if (!PerformanceManager.instance) {
            PerformanceManager.instance = new PerformanceManager();
        }
        return PerformanceManager.instance;
    }

    initialize(): void {
        this.applyConfig(this.config);
        this.startMonitoring();
        this.setupEventListeners();

        console.log('PerformanceManager initialized with config:', this.config);
    }

    private detectInitialConfig(): PerformanceConfig {
        // 基礎設備檢測
        const deviceInfo = this.getDeviceInfo();
        const isLowEndDevice = this.isLowEndDevice(deviceInfo);
        const isMobile = deviceInfo.deviceType === 'mobile';

        // 根據設備類型和性能決定初始配置
        if (isLowEndDevice || isMobile) {
            return {
                level: 'basic',
                maxFPS: 30,
                enableComplexAnimations: false,
                enableParticleEffects: false,
                enableAdvancedEffects: false
            };
        } else {
            return {
                level: 'enhanced',
                maxFPS: 60,
                enableComplexAnimations: true,
                enableParticleEffects: true,
                enableAdvancedEffects: false
            };
        }
    }

    private getDeviceInfo() {
        const width = screen.width;
        const height = screen.height;
        const userAgent = navigator.userAgent.toLowerCase();

        // 簡單的設備類型檢測
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isTablet = (width >= 768 || height >= 768) && isMobile;

        return {
            deviceType: isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop'),
            screenWidth: width,
            screenHeight: height,
            userAgent
        };
    }

    private isLowEndDevice(deviceInfo: any): boolean {
        // 簡單的低端設備檢測
        const { deviceType, screenWidth, screenHeight } = deviceInfo;

        if (deviceType === 'mobile') {
            // 小屏幕手機認為是低端設備
            return screenWidth < 360 || screenHeight < 640;
        }

        return false;
    }

    private applyConfig(config: PerformanceConfig): void {
        this.config = config;

        // 應用CSS類
        document.body.className = document.body.className.replace(/performance-\w+/g, '');
        document.body.classList.add(`performance-${config.level}`);

        // 更新性能指示器
        this.performanceIndicator.update(config.level);

        // 觸發自定義事件
        window.dispatchEvent(new CustomEvent('performanceConfigChanged', {
            detail: config
        }));
    }

    private startMonitoring(): void {
        // 監控FPS並根據需要調整
        this.fpsMonitor.start((fps) => {
            if (fps < 20) {
                this.degradePerformance();
            } else if (fps > 55 && this.config.level !== 'full') {
                this.upgradePerformance();
            }
        });
    }

    private setupEventListeners(): void {
        // 監聽電池狀態（如果可用）
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                const updateBatteryStatus = () => {
                    if (battery.level < 0.2 && !battery.charging) {
                        this.enablePowerSaveMode();
                    } else if (battery.level > 0.5 || battery.charging) {
                        this.disablePowerSaveMode();
                    }
                };

                battery.addEventListener('levelchange', updateBatteryStatus);
                battery.addEventListener('chargingchange', updateBatteryStatus);
                updateBatteryStatus();
            }).catch(() => {
                console.log('Battery API not available');
            });
        }

        // 監聽窗口大小變化
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // 監聽可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseEffects();
            } else {
                this.resumeEffects();
            }
        });
    }

    private degradePerformance(): void {
        if (this.config.level === 'full') {
            this.setConfig({
                level: 'enhanced',
                enableAdvancedEffects: false
            });
            console.log('Performance degraded to enhanced mode');
        } else if (this.config.level === 'enhanced') {
            this.setConfig({
                level: 'basic',
                enableComplexAnimations: false,
                enableParticleEffects: false
            });
            console.log('Performance degraded to basic mode');
        }
    }

    private upgradePerformance(): void {
        if (this.config.level === 'basic') {
            this.setConfig({
                level: 'enhanced',
                enableComplexAnimations: true,
                enableParticleEffects: true
            });
            console.log('Performance upgraded to enhanced mode');
        } else if (this.config.level === 'enhanced') {
            this.setConfig({
                level: 'full',
                enableAdvancedEffects: true
            });
            console.log('Performance upgraded to full mode');
        }
    }

    private enablePowerSaveMode(): void {
        if (!this.isPowerSaveMode) {
            this.isPowerSaveMode = true;
            const currentConfig = { ...this.config };
            this.setConfig({
                level: 'minimal',
                maxFPS: 30,
                enableComplexAnimations: false,
                enableParticleEffects: false,
                enableAdvancedEffects: false
            });
            console.log('Power save mode enabled');
        }
    }

    private disablePowerSaveMode(): void {
        if (this.isPowerSaveMode) {
            this.isPowerSaveMode = false;
            // 恢復到適當的配置
            this.config = this.detectInitialConfig();
            this.applyConfig(this.config);
            console.log('Power save mode disabled');
        }
    }

    private handleResize(): void {
        // 窗口大小變化時重新評估
        setTimeout(() => {
            const newConfig = this.detectInitialConfig();
            if (newConfig.level !== this.config.level) {
                this.applyConfig(newConfig);
            }
        }, 1000);
    }

    private pauseEffects(): void {
        document.body.classList.add('effects-paused');
    }

    private resumeEffects(): void {
        document.body.classList.remove('effects-paused');
    }

    // 公共API
    setConfig(config: Partial<PerformanceConfig>): void {
        this.config = { ...this.config, ...config };
        this.applyConfig(this.config);
    }

    getConfig(): PerformanceConfig {
        return { ...this.config };
    }

    getFPS(): number {
        return this.fpsMonitor.getCurrentFPS();
    }

    forceBasicMode(): void {
        this.setConfig({
            level: 'basic',
            maxFPS: 30,
            enableComplexAnimations: false,
            enableParticleEffects: false,
            enableAdvancedEffects: false
        });
    }

    forceFullMode(): void {
        this.setConfig({
            level: 'full',
            maxFPS: 60,
            enableComplexAnimations: true,
            enableParticleEffects: true,
            enableAdvancedEffects: true
        });
    }

    destroy(): void {
        this.fpsMonitor.stop();
        document.body.className = document.body.className.replace(/performance-\w+/g, '');
    }
}

// FPS監控器 - 簡化版本
class FPSMonitor {
    private frameCount = 0;
    private lastTime = performance.now();
    private fps = 60;
    private callback: ((fps: number) => void) | null = null;
    private rafId: number | null = null;

    start(callback: (fps: number) => void): void {
        this.callback = callback;
        this.monitor();
    }

    stop(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.callback = null;
    }

    private monitor = (): void => {
        const now = performance.now();
        const delta = now - this.lastTime;

        this.frameCount++;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastTime = now;

            if (this.callback) {
                this.callback(this.fps);
            }
        }

        this.rafId = requestAnimationFrame(this.monitor);
    }

    getCurrentFPS(): number {
        return this.fps;
    }
}

// 性能指示器 - 簡單的UI組件
class PerformanceIndicator {
    private element: HTMLElement | null = null;

    constructor() {
        this.createIndicator();
    }

    private createIndicator(): void {
        this.element = document.createElement('div');
        this.element.className = 'performance-indicator';
        this.element.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.8);
      color: #50fa7b;
      font-size: 12px;
      font-family: monospace;
      border: 1px solid #50fa7b;
      border-radius: 4px;
      z-index: 10000;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    `;
        this.element.textContent = 'PERF: --';
        document.body.appendChild(this.element);

        // 5秒後自動隱藏
        setTimeout(() => {
            if (this.element) {
                this.element.style.opacity = '0';
                setTimeout(() => {
                    if (this.element && this.element.parentNode) {
                        this.element.parentNode.removeChild(this.element);
                        this.element = null;
                    }
                }, 300);
            }
        }, 5000);
    }

    update(level: string): void {
        if (this.element) {
            const colors = {
                minimal: '#ff5555', // 紅色
                basic: '#ffb86c',   // 橙色
                enhanced: '#f1fa8c', // 黃色
                full: '#50fa7b'     // 綠色
            };

            this.element.textContent = `PERF: ${level.toUpperCase()}`;
            this.element.style.borderColor = colors[level as keyof typeof colors] || '#50fa7b';
            this.element.style.color = colors[level as keyof typeof colors] || '#50fa7b';
        }
    }
}

export default PerformanceManager;
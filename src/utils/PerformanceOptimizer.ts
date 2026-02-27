// 性能優化器 - 根據設備性能自動調整視覺效果

export interface PerformanceConfig {
    level: 'minimal' | 'basic' | 'enhanced' | 'full';
    maxFPS: number;
    enableComplexAnimations: boolean;
    enableParticleEffects: boolean;
    enableAdvancedEffects: boolean;
    animationDuration: number;
    particleCount: number;
}

export class PerformanceOptimizer {
    private static instance: PerformanceOptimizer;
    private config: PerformanceConfig;
    private fpsMonitor: FPSMonitor;
    private batteryMonitor: BatteryMonitor;
    private deviceProfiler: DeviceProfiler;
    private isOptimizing: boolean = false;

    private constructor() {
        this.fpsMonitor = new FPSMonitor();
        this.batteryMonitor = new BatteryMonitor();
        this.deviceProfiler = new DeviceProfiler();
        this.config = this.getDefaultConfig();
    }

    static getInstance(): PerformanceOptimizer {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }

    async initialize(): Promise<void> {
        // 分析設備性能
        const deviceInfo = await this.deviceProfiler.analyzeDevice();
        const initialConfig = this.determineInitialConfig(deviceInfo);

        this.applyConfig(initialConfig);

        // 開始監控
        this.startMonitoring();

        console.log('PerformanceOptimizer initialized:', {
            deviceInfo,
            config: this.config
        });
    }

    private getDefaultConfig(): PerformanceConfig {
        return {
            level: 'enhanced',
            maxFPS: 60,
            enableComplexAnimations: true,
            enableParticleEffects: true,
            enableAdvancedEffects: true,
            animationDuration: 3000,
            particleCount: 30
        };
    }

    private determineInitialConfig(deviceInfo: DeviceInfo): PerformanceConfig {
        const { deviceType, memory, cores } = deviceInfo;

        // 根據設備類型和規格決定初始配置
        if (deviceType === 'mobile') {
            if (memory < 4 || cores < 4) {
                return {
                    level: 'minimal',
                    maxFPS: 30,
                    enableComplexAnimations: false,
                    enableParticleEffects: false,
                    enableAdvancedEffects: false,
                    animationDuration: 6000,
                    particleCount: 5
                };
            } else if (memory < 8 || cores < 8) {
                return {
                    level: 'basic',
                    maxFPS: 45,
                    enableComplexAnimations: true,
                    enableParticleEffects: false,
                    enableAdvancedEffects: false,
                    animationDuration: 5000,
                    particleCount: 10
                };
            } else {
                return {
                    level: 'enhanced',
                    maxFPS: 60,
                    enableComplexAnimations: true,
                    enableParticleEffects: true,
                    enableAdvancedEffects: false,
                    animationDuration: 4000,
                    particleCount: 20
                };
            }
        } else if (deviceType === 'tablet') {
            return {
                level: 'enhanced',
                maxFPS: 60,
                enableComplexAnimations: true,
                enableParticleEffects: true,
                enableAdvancedEffects: memory > 4,
                animationDuration: 4000,
                particleCount: 25
            };
        } else { // desktop
            if (cores >= 8 && memory >= 16) {
                return {
                    level: 'full',
                    maxFPS: 60,
                    enableComplexAnimations: true,
                    enableParticleEffects: true,
                    enableAdvancedEffects: true,
                    animationDuration: 3000,
                    particleCount: 30
                };
            } else {
                return {
                    level: 'enhanced',
                    maxFPS: 60,
                    enableComplexAnimations: true,
                    enableParticleEffects: true,
                    enableAdvancedEffects: false,
                    animationDuration: 4000,
                    particleCount: 20
                };
            }
        }
    }

    private applyConfig(config: PerformanceConfig): void {
        this.config = config;

        // 應用CSS類
        document.body.className = document.body.className.replace(/performance-\w+/g, '');
        document.body.classList.add(`performance-${config.level}`);

        // 應用CSS自定義屬性
        document.documentElement.style.setProperty('--animation-duration', `${config.animationDuration}ms`);
        document.documentElement.style.setProperty('--particle-count', config.particleCount.toString());
        document.documentElement.style.setProperty('--max-fps', config.maxFPS.toString());

        // 觸發自定義事件
        window.dispatchEvent(new CustomEvent('performanceConfigChanged', { detail: config }));
    }

    private startMonitoring(): void {
        // FPS監控
        this.fpsMonitor.start((fps) => {
            if (fps < this.config.maxFPS * 0.8) {
                this.degradePerformance();
            } else if (fps >= this.config.maxFPS * 0.95) {
                this.upgradePerformance();
            }
        });

        // 電池監控
        this.batteryMonitor.start((batteryInfo) => {
            if (batteryInfo.level < 0.2 && !batteryInfo.charging) {
                this.enablePowerSaveMode();
            } else if (batteryInfo.level > 0.5 || batteryInfo.charging) {
                this.disablePowerSaveMode();
            }
        });

        // 定期重新評估
        setInterval(() => {
            this.reassessPerformance();
        }, 30000); // 每30秒重新評估一次
    }

    private degradePerformance(): void {
        if (this.isOptimizing) return;
        this.isOptimizing = true;

        const currentLevel = this.config.level;
        const levels: PerformanceConfig['level'][] = ['minimal', 'basic', 'enhanced', 'full'];
        const currentIndex = levels.indexOf(currentLevel);

        if (currentIndex > 0) {
            const newLevel = levels[currentIndex - 1];
            const newConfig = this.getConfigForLevel(newLevel);
            this.applyConfig(newConfig);
            console.log(`Performance degraded to ${newLevel}`);
        }

        this.isOptimizing = false;
    }

    private upgradePerformance(): void {
        if (this.isOptimizing) return;
        this.isOptimizing = true;

        const currentLevel = this.config.level;
        const levels: PerformanceConfig['level'][] = ['minimal', 'basic', 'enhanced', 'full'];
        const currentIndex = levels.indexOf(currentLevel);

        if (currentIndex < levels.length - 1) {
            const newLevel = levels[currentIndex + 1];
            const newConfig = this.getConfigForLevel(newLevel);
            this.applyConfig(newConfig);
            console.log(`Performance upgraded to ${newLevel}`);
        }

        this.isOptimizing = false;
    }

    private enablePowerSaveMode(): void {
        if (this.config.level !== 'minimal') {
            const powerSaveConfig: PerformanceConfig = {
                level: 'minimal',
                maxFPS: 30,
                enableComplexAnimations: false,
                enableParticleEffects: false,
                enableAdvancedEffects: false,
                animationDuration: 8000,
                particleCount: 3
            };
            this.applyConfig(powerSaveConfig);
            console.log('Power save mode enabled');
        }
    }

    private disablePowerSaveMode(): void {
        // 重新評估性能以決定恢復到哪個級別
        this.reassessPerformance();
        console.log('Power save mode disabled');
    }

    private async reassessPerformance(): Promise<void> {
        const deviceInfo = await this.deviceProfiler.analyzeDevice();
        const currentFPS = this.fpsMonitor.getCurrentFPS();
        const batteryInfo = this.batteryMonitor.getBatteryInfo();

        let targetLevel: PerformanceConfig['level'] = 'enhanced';

        if (batteryInfo.level < 0.3 && !batteryInfo.charging) {
            targetLevel = 'basic';
        } else if (currentFPS < 30) {
            targetLevel = 'basic';
        } else if (currentFPS > 55 && deviceInfo.cores >= 8) {
            targetLevel = 'full';
        }

        const newConfig = this.getConfigForLevel(targetLevel);
        this.applyConfig(newConfig);
    }

    private getConfigForLevel(level: PerformanceConfig['level']): PerformanceConfig {
        const configs: Record<PerformanceConfig['level'], PerformanceConfig> = {
            minimal: {
                level: 'minimal',
                maxFPS: 30,
                enableComplexAnimations: false,
                enableParticleEffects: false,
                enableAdvancedEffects: false,
                animationDuration: 8000,
                particleCount: 3
            },
            basic: {
                level: 'basic',
                maxFPS: 45,
                enableComplexAnimations: true,
                enableParticleEffects: false,
                enableAdvancedEffects: false,
                animationDuration: 6000,
                particleCount: 10
            },
            enhanced: {
                level: 'enhanced',
                maxFPS: 60,
                enableComplexAnimations: true,
                enableParticleEffects: true,
                enableAdvancedEffects: false,
                animationDuration: 4000,
                particleCount: 20
            },
            full: {
                level: 'full',
                maxFPS: 60,
                enableComplexAnimations: true,
                enableParticleEffects: true,
                enableAdvancedEffects: true,
                animationDuration: 3000,
                particleCount: 30
            }
        };

        return configs[level];
    }

    getCurrentConfig(): PerformanceConfig {
        return { ...this.config };
    }

    setConfig(config: Partial<PerformanceConfig>): void {
        this.config = { ...this.config, ...config };
        this.applyConfig(this.config);
    }

    destroy(): void {
        this.fpsMonitor.stop();
        this.batteryMonitor.stop();
    }
}

// FPS監控器
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

// 電池監控器
class BatteryMonitor {
    private batteryInfo: BatteryInfo = { level: 1, charging: true };
    private callback: ((info: BatteryInfo) => void) | null = null;

    async start(callback: (info: BatteryInfo) => void): Promise<void> {
        this.callback = callback;

        if ('getBattery' in navigator) {
            try {
                const battery = await (navigator as any).getBattery() as BatteryManager;
                this.updateBatteryInfo(battery);

                battery.addEventListener('levelchange', () => this.updateBatteryInfo(battery));
                battery.addEventListener('chargingchange', () => this.updateBatteryInfo(battery));
            } catch (error) {
                console.warn('Battery API not available:', error);
            }
        }
    }

    stop(): void {
        this.callback = null;
    }

    private updateBatteryInfo(battery: BatteryManager): void {
        this.batteryInfo = {
            level: battery.level,
            charging: battery.charging
        };

        if (this.callback) {
            this.callback(this.batteryInfo);
        }
    }

    getBatteryInfo(): BatteryInfo {
        return { ...this.batteryInfo };
    }
}

// 設備分析器
class DeviceProfiler {
    async analyzeDevice(): Promise<DeviceInfo> {
        // 使用類型斷言來處理實驗性API
        const nav = navigator as any;
        const memory = nav.deviceMemory || 4; // GB
        const cores = nav.hardwareConcurrency || 4;
        const deviceType = this.detectDeviceType();

        return {
            deviceType,
            memory,
            cores
        };
    }

    private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
        const width = screen.width;
        const height = screen.height;
        const userAgent = navigator.userAgent.toLowerCase();

        // 檢測移動設備
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

        if (isMobile) {
            // 區分手機和平板
            return (width >= 768 || height >= 768) ? 'tablet' : 'mobile';
        }

        return 'desktop';
    }
}

// 類型定義
interface BatteryInfo {
    level: number;
    charging: boolean;
}

interface DeviceInfo {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    memory: number; // GB
    cores: number;
}

interface BatteryManager {
    level: number;
    charging: boolean;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}

export default PerformanceOptimizer;
<html lang="en" class="scroll-smooth bg-[#000000]" vid="0"><head vid="1">
    <meta charset="UTF-8" vid="2">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" vid="3">
    <title vid="4">Midnight | 60-Word Crypto &amp; AI News</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com" vid="5">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" vid="6">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet" vid="7">
    
    <script src="https://unpkg.com/@phosphor-icons/web" vid="8"></script>
    <script src="https://cdn.tailwindcss.com/3.4.17" vid="9"></script>
    
    <script vid="10">
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        appBg: '#000000',
                        appCard: '#050505',
                        appPrimary: '#f4f4f5',
                        appSecondary: '#888888',
                        appText1: '#f4f4f5',
                        appText2: '#a1a1aa',
                        appBorderElem: 'rgba(255,255,255,0.08)',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    backgroundImage: {
                        'glow-top': 'radial-gradient(circle at 50% -20%, rgba(180, 200, 255, 0.15) 0%, rgba(0,0,0,0) 60%)',
                        'glow-bottom': 'radial-gradient(circle at 50% 120%, rgba(180, 200, 255, 0.15) 0%, rgba(0,0,0,0) 60%)',
                        'glow-center': 'radial-gradient(circle at 50% 50%, rgba(180, 200, 255, 0.1) 0%, rgba(0,0,0,0) 60%)',
                    },
                    animation: {
                        'marquee': 'marquee 30s linear infinite',
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    },
                    keyframes: {
                        marquee: {
                            '0%': { transform: 'translateX(0%)' },
                            '100%': { transform: 'translateX(-50%)' },
                        }
                    }
                }
            }
        }
    </script>
    <style vid="11">
        body {
            background-color: #000000;
            color: #f4f4f5;
        }
        ::selection {
            background-color: #f4f4f5;
            color: #000000;
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    </style>
</head>
<body class="font-sans antialiased overflow-x-hidden w-full min-h-screen flex flex-col bg-[#000000] selection:bg-white selection:text-black" vid="12">

    
    <nav class="w-full border-b border-[#ffffff10] bg-[#000000]/80 backdrop-blur-xl z-50 sticky top-0" vid="13">
        <div class="max-w-[1440px] mx-auto px-8 py-5 flex justify-between items-center" vid="14">
            <div class="flex items-center gap-3" vid="15">
                <div class="w-5 h-5 rounded-full bg-[#f4f4f5] flex items-center justify-center" vid="16">
                    <div class="w-1.5 h-1.5 bg-[#000000] rounded-full" vid="17"></div>
                </div>
                <span class="text-base font-medium tracking-tight text-[#f4f4f5]" vid="18">Midnight</span>
            </div>
            <div class="hidden md:flex items-center gap-10 font-sans text-xs font-medium" vid="19">
                <a href="#how-it-works" class="text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors" vid="20">Protocol</a>
                <a href="#markets" class="text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors" vid="21">Markets</a>
                <a href="#download" class="bg-[#f4f4f5] text-[#000000] px-5 py-2 rounded-full hover:bg-white transition-colors" vid="22">Get App</a>
            </div>
        </div>
    </nav>

    
    <header class="w-full relative overflow-hidden bg-[#000000] border-b border-[#ffffff10] min-h-[90vh] flex items-center" vid="23">
        
        <div class="absolute inset-0 bg-glow-top opacity-100 pointer-events-none" vid="24"></div>

        <div class="max-w-[1440px] mx-auto px-8 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10" vid="25">
            
            
            <div class="lg:col-span-7 flex flex-col gap-10" vid="26">
                <div class="inline-flex items-center gap-3 bg-transparent py-2 w-max" vid="27">
                    <span class="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full animate-pulse-slow" vid="28"></span>
                    <span class="font-mono text-[9px] font-normal uppercase tracking-[0.2em] text-[#a1a1aa]" vid="29">Live on Solana Mainnet</span>
                </div>
                
                <h1 class="text-6xl sm:text-7xl lg:text-[100px] font-medium tracking-tight leading-[1] text-[#f4f4f5]" vid="30">
                    Zero <span class="text-[#f4f4f5]" style="" vid="31">Fluff.</span><br vid="32">
                    Just <span class="text-[#888888]" vid="33">Facts.</span><br vid="34">
                    60 Words.
                </h1>
                
                <p class="font-mono text-[10px] sm:text-[11px] text-[#888888] max-w-md leading-[2.2] tracking-[0.15em] uppercase border-none pl-0 py-2 mt-4" vid="35">
                    Crypto and AI alpha distilled to the absolute essentials. Read the facts in seconds. Place informed bets instantly on outcomes.
                </p>
                
                <div class="flex flex-col sm:flex-row gap-4 mt-8" vid="36">
                    <a href="#download" class="bg-[#f4f4f5] text-[#000000] font-sans font-medium text-sm py-4 px-8 rounded-full hover:bg-white transition-all flex items-center justify-center gap-2" vid="37">
                        <i class="ph-fill ph-apple-logo text-lg" vid="38"></i>
                        App Store
                    </a>
                    <a href="#download" class="bg-transparent border border-[#ffffff20] text-[#f4f4f5] font-sans font-medium text-sm py-4 px-8 rounded-full hover:bg-[#ffffff05] transition-all flex items-center justify-center gap-2" vid="39">
                        <i class="ph-fill ph-google-play-logo text-lg" vid="40"></i>
                        Google Play
                    </a>
                </div>

                <div class="flex items-center gap-4 mt-8 font-mono text-[9px] text-[#888888] uppercase tracking-[0.15em]" vid="41">
                    <div class="flex -space-x-2" vid="42">
                        <div class="w-8 h-8 rounded-full border border-[#111111] bg-[#222222] flex items-center justify-center text-[#888888] text-xs" vid="43"><i class="ph-fill ph-user" vid="44"></i></div>
                        <div class="w-8 h-8 rounded-full border border-[#111111] bg-[#333333] flex items-center justify-center text-[#888888] text-xs" vid="45"><i class="ph-fill ph-user" vid="46"></i></div>
                        <div class="w-8 h-8 rounded-full border border-[#111111] bg-[#444444] flex items-center justify-center text-[#888888] text-xs" vid="47"><i class="ph-fill ph-user" vid="48"></i></div>
                    </div>
                    <div vid="49">
                        <span class="text-[#f4f4f5]" vid="50">50K+</span> Traders already predicting
                    </div>
                </div>
            </div>

            
            <div class="lg:col-span-5 flex justify-center relative mt-20 lg:mt-0" vid="51">
                
                
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-glow-center opacity-60 blur-[100px] rounded-full pointer-events-none" vid="52"></div>

                
                <div class="relative w-[340px] h-[720px] bg-[#050505] border border-[#ffffff15] rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-20" vid="53">
                    
                    
                    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#000000] border-x border-b border-[#ffffff15] rounded-b-[1rem] z-50" vid="54"></div>
                    
                    
                    <div class="h-12 w-full flex justify-between items-end px-7 pb-2 text-[10px] font-sans font-medium text-[#888888] z-40 relative" vid="55">
                        <span vid="56">9:41</span>
                        <div class="flex items-center gap-1.5" vid="57">
                            <i class="ph-fill ph-cell-signal-full" vid="58"></i>
                            <i class="ph-fill ph-wifi-high" vid="59"></i>
                            <i class="ph-fill ph-battery-full" vid="60"></i>
                        </div>
                    </div>

                    
                    <div class="px-6 py-4 border-none flex justify-between items-center bg-transparent sticky top-0 z-30" vid="61">
                        <span class="text-sm font-medium tracking-tight text-[#f4f4f5]" vid="62">Midnight</span>
                        <div class="flex gap-3" vid="63">
                            <div class="w-7 h-7 rounded-full bg-[#ffffff0a] flex items-center justify-center text-[#a1a1aa]" vid="64">
                                <i class="ph ph-magnifying-glass" vid="65"></i>
                            </div>
                            <div class="w-7 h-7 rounded-full bg-[#ffffff0a] text-[#f4f4f5] flex items-center justify-center" vid="66">
                                <i class="ph-fill ph-user" vid="67"></i>
                            </div>
                        </div>
                    </div>

                    
                    <div class="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-4 relative z-30" vid="68">
                        
                        
                        <div class="flex justify-center mb-2 opacity-50 text-[#555555]" vid="69">
                            <i class="ph ph-caret-up text-lg" vid="70"></i>
                        </div>

                        
                        <div class="bg-[#ffffff03] border border-[#ffffff0a] p-5 rounded-2xl flex flex-col relative hover:bg-[#ffffff05] transition-colors" vid="71">
                            <div class="flex justify-between items-center mb-5" vid="72">
                                <div class="text-[#a1a1aa] bg-transparent font-mono uppercase tracking-[0.15em] text-[9px] border-none px-0 py-0" vid="73">Crypto</div>
                                <span class="text-[#555555] font-mono text-[9px] uppercase tracking-widest" vid="74">2m ago</span>
                            </div>
                            
                            <h2 class="text-[17px] font-medium text-[#f4f4f5] leading-[1.3] mb-4 tracking-tight" vid="75">
                                Solana Mainnet V1.17 Deployed Globally, Targets Congestion
                            </h2>
                            
                            <p class="text-[10px] text-[#888888] leading-[2.2] mb-6 font-mono uppercase tracking-widest border-none pl-0" vid="76">
                                Solana developers successfully rolled out the v1.17 update to mainnet today. The patch addresses recent network congestion issues by optimizing transaction scheduling. Initial data shows a 40% increase in successful transaction throughput. Validator adoption reached 85% within four hours, signaling strong consensus. SOL price remains stable.
                            </p>

                            
                            <div class="mt-2 border-t border-[#ffffff0a] pt-5" vid="77">
                                <div class="flex items-center gap-2 mb-3" vid="78">
                                    <div class="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full opacity-50" vid="79"></div>
                                    <span class="text-[8px] font-mono text-[#888888] uppercase tracking-[0.2em]" vid="80">Prediction Market</span>
                                </div>
                                <h3 class="text-xs font-medium text-[#f4f4f5] mb-4" vid="81">Will SOL surpass $150 by end of week?</h3>
                                
                                <div class="flex gap-2" vid="82">
                                    <button class="flex-1 bg-[#ffffff05] border border-[#ffffff10] text-[#f4f4f5] rounded-xl py-3 px-4 flex justify-between items-center font-sans text-xs hover:bg-[#ffffff10] transition-colors" vid="83">
                                        <span vid="84">YES</span>
                                        <span class="text-[#888888]" vid="85">68%</span>
                                    </button>
                                    <button class="flex-1 bg-[#ffffff05] border border-[#ffffff10] text-[#f4f4f5] rounded-xl py-3 px-4 flex justify-between items-center font-sans text-xs hover:bg-[#ffffff10] transition-colors" vid="86">
                                        <span vid="87">NO</span>
                                        <span class="text-[#888888]" vid="88">32%</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        
                        <div class="bg-[#ffffff03] border border-[#ffffff0a] p-5 rounded-2xl flex flex-col relative hover:bg-[#ffffff05] transition-colors" vid="89">
                            <div class="flex justify-between items-center mb-5" vid="90">
                                <div class="text-[#a1a1aa] bg-transparent font-mono uppercase tracking-[0.15em] text-[9px] border-none px-0 py-0" vid="91">AI Tech</div>
                                <span class="text-[#555555] font-mono text-[9px] uppercase tracking-widest" vid="92">15m ago</span>
                            </div>
                            
                            <h2 class="text-[17px] font-medium text-[#f4f4f5] leading-[1.3] mb-4 tracking-tight" vid="93">
                                Anthropic Announces Claude 3 Opus Benchmarks
                            </h2>
                            
                            <p class="text-[10px] text-[#888888] leading-[2.2] mb-6 font-mono uppercase tracking-widest border-none pl-0" vid="94">
                                Anthropic released official benchmarks for Claude 3 Opus, claiming superiority over GPT-4 across major standardized tests including MMLU and GSM8K. The model exhibits near-perfect recall in 200K token contexts. Researchers highlight significant improvements in mathematical reasoning. API access opens to enterprise customers immediately.
                            </p>

                            
                            <div class="mt-2 border-t border-[#ffffff0a] pt-5" vid="95">
                                <div class="flex items-center gap-2 mb-3" vid="96">
                                    <div class="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full opacity-50" vid="97"></div>
                                    <span class="text-[8px] font-mono text-[#888888] uppercase tracking-[0.2em]" vid="98">Prediction Market</span>
                                </div>
                                <h3 class="text-xs font-medium text-[#f4f4f5] mb-4" vid="99">Will OpenAI respond with a new model release in 7 days?</h3>
                                
                                <div class="flex gap-2" vid="100">
                                    <button class="flex-1 bg-[#ffffff05] border border-[#ffffff10] text-[#f4f4f5] rounded-xl py-3 px-4 flex justify-between items-center font-sans text-xs hover:bg-[#ffffff10] transition-colors" vid="101">
                                        <span vid="102">YES</span>
                                        <span class="text-[#888888]" vid="103">41%</span>
                                    </button>
                                    <button class="flex-1 bg-[#ffffff05] border border-[#ffffff10] text-[#f4f4f5] rounded-xl py-3 px-4 flex justify-between items-center font-sans text-xs hover:bg-[#ffffff10] transition-colors" vid="104">
                                        <span vid="105">NO</span>
                                        <span class="text-[#888888]" vid="106">59%</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        
                        <div class="h-12 w-full" vid="107"></div>
                    </div>

                    
                    <div class="h-[80px] border-t border-[#ffffff10] bg-[#050505] flex justify-around items-center px-4 z-30 pb-4 absolute bottom-0 w-full" vid="108">
                        <button class="flex flex-col items-center gap-1.5 text-[#f4f4f5]" vid="109">
                            <i class="ph-fill ph-cards text-[20px]" vid="110"></i>
                            <span class="text-[8px] font-sans font-medium tracking-wide" vid="111">Feed</span>
                        </button>
                        <button class="flex flex-col items-center gap-1.5 text-[#555555] hover:text-[#f4f4f5] transition-colors" vid="112">
                            <i class="ph ph-chart-line-up text-[20px]" vid="113"></i>
                            <span class="text-[8px] font-sans font-medium tracking-wide" vid="114">Explore</span>
                        </button>
                        
                        <div class="w-12 h-12 bg-[#f4f4f5] rounded-full flex items-center justify-center text-[#000000] cursor-pointer hover:bg-white transition-colors border-none shadow-none mt-2" vid="115">
                            <i class="ph ph-arrows-down-up text-xl" vid="116"></i>
                        </div>
                        <button class="flex flex-col items-center gap-1.5 text-[#555555] hover:text-[#f4f4f5] transition-colors" vid="117">
                            <i class="ph ph-target text-[20px]" vid="118"></i>
                            <span class="text-[8px] font-sans font-medium tracking-wide" vid="119">Markets</span>
                        </button>
                        <button class="flex flex-col items-center gap-1.5 text-[#555555] hover:text-[#f4f4f5] transition-colors relative" vid="120">
                            <i class="ph ph-wallet text-[20px]" vid="121"></i>
                            <span class="text-[8px] font-sans font-medium tracking-wide" vid="122">Wallet</span>
                        </button>
                    </div>
                </div>

                
                <div class="absolute top-1/4 -right-8 lg:-right-16 bg-[#111111]/80 backdrop-blur-md border border-[#ffffff15] px-6 py-2.5 rounded-full font-mono text-[9px] uppercase tracking-widest text-[#f4f4f5] z-10 hidden md:block" vid="123">
                    $SOL <span class="text-[#a1a1aa] ml-2" vid="124">+4.2%</span>
                </div>
                <div class="absolute bottom-1/4 -left-8 lg:-left-16 bg-[#111111]/80 backdrop-blur-md border border-[#ffffff15] px-6 py-2.5 rounded-full font-mono text-[9px] uppercase tracking-widest text-[#f4f4f5] z-30 hidden md:block" vid="125">
                    AI Index Active
                </div>

            </div>
        </div>
    </header>

    
    <div class="w-full bg-[#000000] py-6 overflow-hidden flex whitespace-nowrap border-b border-[#ffffff10] relative z-20" vid="126">
        <div class="flex animate-marquee font-mono text-[10px] text-[#555555] tracking-[0.2em] uppercase" vid="127">
            <span class="mx-12 text-[#333333]" vid="128">• <span class="text-[#888888] ml-4" vid="129">60-WORD NEWS SUMMARIES</span></span>
            <span class="mx-12 text-[#333333]" vid="130">• <span class="text-[#888888] ml-4" vid="131">NO FLUFF, JUST THE FACTS</span></span>
            <span class="mx-12 text-[#333333]" vid="132">• <span class="text-[#888888] ml-4" vid="133">GET INFORMED IN SECONDS, NOT MINUTES</span></span>
            <span class="mx-12 text-[#333333]" vid="134">• <span class="text-[#888888] ml-4" vid="135">PLACE INFORMED BETS</span></span>
            <span class="mx-12 text-[#333333]" vid="136">• <span class="text-[#888888] ml-4" vid="137">BUILT ON SOLANA</span></span>
        </div>
        <div class="flex animate-marquee font-mono text-[10px] text-[#555555] tracking-[0.2em] uppercase absolute top-6 left-[100%]" vid="138">
            <span class="mx-12 text-[#333333]" vid="139">• <span class="text-[#888888] ml-4" vid="140">60-WORD NEWS SUMMARIES</span></span>
            <span class="mx-12 text-[#333333]" vid="141">• <span class="text-[#888888] ml-4" vid="142">NO FLUFF, JUST THE FACTS</span></span>
            <span class="mx-12 text-[#333333]" vid="143">• <span class="text-[#888888] ml-4" vid="144">GET INFORMED IN SECONDS, NOT MINUTES</span></span>
            <span class="mx-12 text-[#333333]" vid="145">• <span class="text-[#888888] ml-4" vid="146">PLACE INFORMED BETS</span></span>
            <span class="mx-12 text-[#333333]" vid="147">• <span class="text-[#888888] ml-4" vid="148">BUILT ON SOLANA</span></span>
        </div>
    </div>

    
    <section id="how-it-works" class="w-full bg-[#000000] py-40 border-b border-[#ffffff10] relative" vid="149">
        
        <div class="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" vid="150"></div>

        <div class="max-w-[1440px] mx-auto px-8 relative z-10" vid="151">
            
            <div class="mb-24 flex flex-col md:flex-row justify-between items-end gap-8" vid="152">
                <h2 class="text-5xl md:text-6xl font-medium tracking-tight text-[#f4f4f5] leading-[1]" vid="153">
                    How it works<span class="text-[#f4f4f5] hidden" vid="154">.</span>
                </h2>
                <p class="font-mono text-[10px] text-[#888888] tracking-[0.15em] uppercase border-none pl-0 pb-2 max-w-xs" vid="155">
                    Maximum Information. Minimum Time. The protocol for modern traders.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 bg-transparent border-none" vid="156">
                
                
                <div class="p-12 bg-[#ffffff03] border border-[#ffffff0a] rounded-3xl relative group hover:bg-[#ffffff05] transition-colors duration-300 overflow-hidden" vid="157">
                    <div class="absolute top-10 right-10 text-[10px] font-mono text-[#555555] uppercase tracking-widest" vid="158">No. 01</div>
                    <div class="relative z-10 flex flex-col h-full mt-10" vid="159">
                        <div class="w-12 h-12 rounded-full border border-[#ffffff10] bg-transparent text-[#f4f4f5] flex items-center justify-center mb-12 shadow-none" vid="160">
                            <i class="ph ph-device-mobile text-xl" vid="161"></i>
                        </div>
                        <h3 class="text-2xl font-medium text-[#f4f4f5] mb-6 tracking-tight" vid="162">Open &amp; Swipe</h3>
                        <p class="text-[#888888] font-mono text-[10px] uppercase tracking-[0.15em] leading-[2.2] border-none pl-0 mt-auto" vid="163">
                            Dive into a vertical feed of ultra-concise news. Swipe up to move to the next story instantly. No loading, no waiting.
                        </p>
                    </div>
                </div>

                
                <div class="p-12 bg-[#ffffff03] border border-[#ffffff0a] rounded-3xl relative group hover:bg-[#ffffff05] transition-colors duration-300 overflow-hidden" vid="164">
                    <div class="absolute top-10 right-10 text-[10px] font-mono text-[#555555] uppercase tracking-widest" vid="165">No. 02</div>
                    <div class="relative z-10 flex flex-col h-full mt-10" vid="166">
                        <div class="w-12 h-12 rounded-full border border-[#ffffff10] bg-transparent text-[#f4f4f5] flex items-center justify-center mb-12 shadow-none" vid="167">
                            <i class="ph ph-book-open text-xl" vid="168"></i>
                        </div>
                        <h3 class="text-2xl font-medium text-[#f4f4f5] mb-6 tracking-tight" vid="169">Read 60 Words</h3>
                        <p class="text-[#888888] font-mono text-[10px] uppercase tracking-[0.15em] leading-[2.2] border-none pl-0 mt-auto" vid="170">
                            No fluff, no filler. Just the critical information you need regarding Crypto and AI, curated by experts. Read the facts in seconds.
                        </p>
                    </div>
                </div>

                
                <div class="p-12 bg-[#ffffff03] border border-[#ffffff0a] rounded-3xl relative group hover:bg-[#ffffff05] transition-colors duration-300 overflow-hidden" vid="171">
                    <div class="absolute top-10 right-10 text-[10px] font-mono text-[#555555] uppercase tracking-widest" vid="172">No. 03</div>
                    <div class="relative z-10 flex flex-col h-full mt-10" vid="173">
                        <div class="w-12 h-12 rounded-full border border-[#ffffff10] bg-transparent text-[#f4f4f5] flex items-center justify-center mb-12 shadow-none" vid="174">
                            <i class="ph ph-coins text-xl" vid="175"></i>
                        </div>
                        <h3 class="text-2xl font-medium text-[#f4f4f5] mb-6 tracking-tight" vid="176">Place Bets</h3>
                        <p class="text-[#888888] font-mono text-[10px] uppercase tracking-[0.15em] leading-[2.2] border-none pl-0 mt-auto" vid="177">
                            Turn knowledge into action. Tap YES or NO to place informed bets on story outcomes using prediction markets built directly on Solana.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    </section>

    
    <section id="download" class="w-full bg-[#000000] border-b border-[#ffffff10] py-40 px-6 relative overflow-hidden" vid="178">
        
        
        <div class="absolute inset-0 bg-glow-bottom opacity-80 pointer-events-none" vid="179"></div>
        <div class="hidden" vid="180"></div>
        <div class="hidden" vid="181">
            <i class="hidden" vid="182"></i>
        </div>

        <div class="max-w-4xl mx-auto flex flex-col items-center justify-center text-center relative z-10" vid="183">
            
            <div class="mb-10 flex items-center gap-3 bg-transparent border-none px-0 py-0 shadow-none" vid="184">
                <span class="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full" vid="185"></span>
                <span class="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a1a1aa]" vid="186">Join 50,000+ Traders</span>
            </div>
            
            <h2 class="text-6xl md:text-8xl font-medium tracking-tight text-[#f4f4f5] leading-[1] mb-8" vid="187">
                Stop reading.<br vid="188">
                <span class="hidden" vid="189"></span>
                <span class="text-[#888888]" vid="190">Start<br vid="191">betting.</span>
            </h2>
            
            <p class="font-mono text-[10px] text-[#888888] max-w-md leading-[2] tracking-[0.15em] uppercase mb-16" vid="192">
                The alpha is waiting. Download Midnight to get informed in seconds and trade on pure signal.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center" vid="193">
                <button class="flex-1 bg-[#f4f4f5] text-[#000000] font-sans font-medium text-sm py-4 px-6 rounded-full hover:bg-white transition-all flex items-center justify-center gap-3 border-none shadow-none" vid="194">
                    <i class="ph-fill ph-apple-logo text-xl" vid="195"></i>
                    <div class="flex flex-col items-start text-left leading-none" vid="196">
                        <span class="font-mono text-[8px] tracking-[0.15em] text-[#555555] mb-0.5 uppercase" vid="197">Download on the</span>
                        <span vid="198">App Store</span>
                    </div>
                </button>
                <button class="flex-1 bg-transparent border border-[#ffffff20] text-[#f4f4f5] font-sans font-medium text-sm py-4 px-6 rounded-full hover:bg-[#ffffff05] transition-all flex items-center justify-center gap-3 shadow-none" vid="199">
                    <i class="ph-fill ph-google-play-logo text-xl" vid="200"></i>
                    <div class="flex flex-col items-start text-left leading-none" vid="201">
                        <span class="font-mono text-[8px] tracking-[0.15em] text-[#888888] mb-0.5 uppercase" vid="202">GET IT ON</span>
                        <span vid="203">Google Play</span>
                    </div>
                </button>
            </div>
        </div>
    </section>

    
    <footer class="w-full bg-[#000000] pt-24 pb-12 border-none" vid="204">
        <div class="max-w-[1440px] mx-auto px-8" vid="205">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24" vid="206">
                
                <div class="md:col-span-2" vid="207">
                    <div class="flex items-center gap-3 mb-8" vid="208">
                        <div class="w-6 h-6 rounded-full bg-[#f4f4f5] flex items-center justify-center" vid="209">
                            <div class="w-1.5 h-1.5 bg-[#000000] rounded-full" vid="210"></div>
                        </div>
                        <span class="text-lg font-medium tracking-tight text-[#f4f4f5]" vid="211">Midnight</span>
                    </div>
                    <p class="font-mono text-[10px] text-[#555555] max-w-xs mb-8 uppercase tracking-[0.15em] leading-[2.2]" vid="212">
                        Maximum information. Minimum time. The protocol for the modern trader.
                    </p>
                    <div class="flex gap-3" vid="213">
                        <a href="#" class="w-10 h-10 rounded-full border border-[#ffffff10] flex items-center justify-center text-[#888888] hover:text-[#f4f4f5] hover:bg-[#ffffff05] transition-colors bg-transparent" vid="214">
                            <i class="ph-fill ph-twitter-logo text-lg" vid="215"></i>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full border border-[#ffffff10] flex items-center justify-center text-[#888888] hover:text-[#f4f4f5] hover:bg-[#ffffff05] transition-colors bg-transparent" vid="216">
                            <i class="ph-fill ph-discord-logo text-lg" vid="217"></i>
                        </a>
                    </div>
                </div>

                <div vid="218">
                    <h4 class="font-sans text-xs font-medium text-[#a1a1aa] mb-6" vid="219">Protocol</h4>
                    <ul class="flex flex-col gap-3 font-sans text-sm text-[#f4f4f5]" vid="220">
                        <li vid="221"><a href="#" class="hover:text-[#a1a1aa] transition-colors" vid="222">How it Works</a></li>
                        <li vid="223"><a href="#" class="hover:text-[#a1a1aa] transition-colors" vid="224">Markets</a></li>
                        <li vid="225"><a href="#" class="hover:text-[#a1a1aa] transition-colors" vid="226">Leaderboard</a></li>
                        <li vid="227"><a href="#" class="hover:text-[#a1a1aa] transition-colors" vid="228">Download</a></li>
                    </ul>
                </div>

                <div vid="229">
                    <h4 class="font-sans text-xs font-medium text-[#a1a1aa] mb-6" vid="230">Legal</h4>
                    <ul class="flex flex-col gap-3 font-sans text-sm text-[#f4f4f5]" vid="231">
                        <li vid="232"><a href="#" class="hover:text-[#a1a1aa] transition-colors" vid="233">Terms of Service</a></li>
                        <li vid="234"><a href="#" class="hover:text-[#a1a1aa] transition-colors" vid="235">Privacy Policy</a></li>
                        <li vid="236"><a href="#" class="hover:text-[#a1a1aa] transition-colors" vid="237">Risk Disclosure</a></li>
                    </ul>
                </div>
            </div>

            <div class="border-t border-[#ffffff10] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[9px] text-[#555555] uppercase tracking-[0.2em]" vid="238">
                <div class="flex items-center gap-3" vid="239">
                    <div class="hidden" vid="240"></div>
                    <span vid="241">© 2024 Midnight Tech. All rights reserved.</span>
                </div>
                <div class="flex items-center gap-2 text-[#888888]" vid="242">
                    <div class="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full opacity-50" vid="243"></div>
                    Systems Operational
                </div>
            </div>
        </div>
    </footer>


</body></html>
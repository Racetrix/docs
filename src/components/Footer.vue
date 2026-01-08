<template>
    <footer class="site-footer">
        <div class="container">
            <div class="footer-grid">

                <div class="footer-col brand">
                    <h3>RACE<span class="highlight">TRIX</span></h3>
                    <p>专为赛道日爱好者打造的数据分析与视频合成工具。</p>
                    <div class="version-tag">Current Ver: v0.9.2-beta</div>
                </div>

                <div class="footer-col links">
                    <h4>探索</h4>
                    <ul>
                        <li><router-link to="/synthesis">数据合成</router-link></li>
                        <li><router-link to="/details">详细报表</router-link></li>
                        <li><a href="#">硬件支持列表</a></li>
                        <li><a href="#">API 文档</a></li>
                    </ul>
                </div>

                <div class="footer-col social">
                    <h4>关注我们</h4>
                    <div class="social-icons">
                        <a href="#" class="icon">GITHUB</a>
                        <a href="#" class="icon">BILIBILI</a>
                    </div>
                    <p class="copyright">
                        &copy; 2025 Racetrix Team.<br>Made for speed.
                    </p>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.site-footer {
    background-color: #050505;
    /* 比背景更深一点的黑 */
    border-top: 1px solid rgba(0, 255, 157, 0.2);
    /* 微弱的绿色顶边框 */
    color: #888;
    padding: 60px 0 30px;
    margin-top: auto;
    /* 确保 footer 永远在底部 */
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 40px;
}

h3 {
    color: #fff;
    font-style: italic;
    margin-top: 0;
}

.highlight {
    color: var(--race-green);
}

h4 {
    color: #fff;
    font-size: 0.9rem;
    text-transform: uppercase;
    margin-top: 0;
    letter-spacing: 1px;
}

.footer-col p {
    font-size: 0.9rem;
    line-height: 1.6;
}

.version-tag {
    display: inline-block;
    background: #111;
    color: var(--race-green);
    font-family: monospace;
    font-size: 0.8rem;
    padding: 4px 8px;
    border: 1px solid #333;
    margin-top: 10px;
}

ul {
    list-style: none;
    padding: 0;
}

ul li {
    margin-bottom: 10px;
}

ul a {
    color: #888;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;
}

ul a:hover {
    color: var(--race-green);
}

.social-icons {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.social-icons .icon {
    font-size: 0.75rem;
    background: #222;
    color: #fff;
    padding: 5px 10px;
    text-decoration: none;
    border-radius: 2px;
    font-weight: bold;
}

.social-icons .icon:hover {
    background: var(--race-green);
    color: #000;
}

.copyright {
    font-size: 0.8rem;
    color: #555;
}

@media (max-width: 768px) {
    .footer-grid {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .social-icons {
        justify-content: center;
    }
}
</style>
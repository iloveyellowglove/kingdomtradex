<?php
/**
 * Common footer template
 */
$currentUser = currentUser();
?>
</main>

<?php if ($currentUser): ?>
<div class="container mt-4">
    <div class="row">
        <div class="col-md-6">
            <div class="ekklesia-box mb-3">
                <h6><i class="bi bi-telegram"></i> Join the Ekklesia (Apostle Team)</h6>
                <p class="mb-1"><small>Connect with fellow stewards. Receive prophetic market insights. Coordinate the harvest.</small></p>
                <a href="https://t.me/yourgroup" target="_blank" rel="noopener" class="btn btn-sm btn-outline-warning mt-2">
                    <i class="bi bi-telegram"></i> Join on Telegram
                </a>
            </div>
        </div>
        <div class="col-md-6">
            <div class="ekklesia-box mb-3">
                <h6><i class="bi bi-shield-lock-fill"></i> Confidential Onboarding</h6>
                <p class="mb-1"><small>For private coaching, use BonChat - encrypted and secure. Your financial journey stays between you and your spiritual covering.</small></p>
                <a href="https://bonchat.io/yourlink" target="_blank" rel="noopener" class="btn btn-sm btn-outline-light mt-2">
                    <i class="bi bi-chat-dots"></i> Open BonChat
                </a>
            </div>
        </div>
    </div>
</div>
<?php endif; ?>

<footer class="bg-dark text-light py-4 mt-5">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <p class="mb-1"><strong>KingdomTrade Exchange</strong> — Professional cryptocurrency trading platform.</p>
                <small class="text-muted">Secure blockchain transactions. All balances and trades are processed in real time.</small>
            </div>
            <div class="col-md-6 text-md-end">
                <small>&copy; <?= date('Y') ?> KingdomTrade Exchange. All rights reserved.</small><br>
                <small class="text-muted">"The earth is the LORD's, and the fullness thereof." (Psalm 24:1)</small>
            </div>
        </div>
    </div>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="/assets/js/ephod_chatbot.js"></script>
<?= $extraScripts ?? '' ?>
</body>
</html>

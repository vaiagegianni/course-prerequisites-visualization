<?php
require 'database.php';
?>

<!DOCTYPE html>
<html lang="el">
    <head>
        <meta charset="UTF-8">
        <title>UoP - Οπτικοποίηση Προαπαιτούμενων Οδηγού Σπουδών</title>
        <link rel="stylesheet" href="style.css?v=99">
    </head>

    <body>
        <header>
            <div class="header-inner">

                <a href="index.php" class="header-logo">
                <img src="images/logo-dit-el.png" alt="Τμήμα Πληροφορικής και Τηλεπικοινωνιών">
                </a>

                <h1 class="header-title">
                Οπτικοποίηση Προαπαιτούμενων Οδηγού Σπουδών
                </h1>

                <nav class="header-actions">
                    <a href="https://dit.uop.gr/" class="header-link" target="_blank">
                        Ιστοσελίδα Τμήματος
                    </a>

                    <a href="https://dit.uop.gr/sites/default/files/publish/dit-course-guide.pdf" class="header-link" target="_blank">
                        Οδηγός Σπουδών
                    </a>
                </nav>

            </div>
        </header>

        <main class="container layout">

            <section class="sidebar">
                <h2>Πίνακας Ελέγχου</h2>

                <div class="control-group">
                    <label>
                        Λειτουργία
                        <span class="info-icon"
                              data-tooltip-html="
                                <strong class='tooltip-highlight'>Focus mode</strong><br>
                                Λειτουργεία ανάλυσης προαπαιτουμένων.<br>Κάνε click σε ένα μάθημα ή αναζήτησέ το για να δεις τα προαπαιτούμενά του και ποια μαθήματα ξεκλειδώνει.<br><br>

                                <strong class='tooltip-highlight'>Planning mode</strong><br>
                                Λειτουργεία οργάνωσης μαθημάτων.<br>Επίλεξε τα μαθήματα που έχεις περάσει για να δεις ποια μαθήματα μπορείς να δηλώσεις και ποια όχι.<br><br>

                                <strong class='tooltip-highlight'>Tip!</strong><br>
                                Κάνε <strong>διπλό click</strong> σε ένα μάθημα για να δεις περισσότερες πληροφοριές σχετικά με αυτό.
                              ">i</span>
                    </label>

                    <div class="radio-row">
                        <label><input type="radio" name="interaction-mode" value="focus" checked> Focus mode</label>
                    </div>
                    <div class="radio-row">
                        <label><input type="radio" name="interaction-mode" value="passed"> Planning mode</label>
                    </div>
                </div>

                <div id="mode-help-block" class="control-group"></div>

                <div class="control-group">
                    <label for="search">
                        Αναζήτηση μαθήματος
                    </label>
                    <input type="text" id="search" placeholder="Κωδικός ή τίτλος μαθήματος...">
                </div>

                <div class="control-group">
                    <label for="year">
                        Μέχρι ποιο έτος να δείξω;
                        <span class="info-icon"
                              data-tooltip-html="
                                Το φίλτρο έτους λειτουργεί προοδευτικά.
                                Αν επιλέξεις 3ο έτος, θα εμφανιστούν μαθήματα 1ου, 2ου και 3ου έτους.
                              ">i</span>
                    </label>
                    <select id="year">
                        <option value="all">Όλα τα έτη</option>
                        <option value="1">1ο έτος</option>
                        <option value="2">2ο έτος</option>
                        <option value="3">3ο έτος</option>
                        <option value="4">4ο έτος</option>
                    </select>
                </div>

                <div class="control-group">
                    <label>
                        <input type="checkbox" id="offered-only"> Κρύψε τα μαθήματα που δεν διεξάγονται φέτος.
                        <span class="info-icon"
                              data-tooltip-html="
                                Εμφανίζονται μόνο τα μαθήματα που θα διεξαχθούν στο τρέχον ακαδημαϊκό έτος.
                              ">i</span>
                    </label>
                </div>

                <div class="control-group">
                    <label>
                        Κατηγορία μαθήματος
                        <span class="info-icon"
                            data-tooltip-html="
                                Άνοιξε κάθε κατηγορία για να εμφανιστούν οι υποκατηγορίες της.
                            ">i</span>
                    </label>

                    <div class="accordion-group">

                        <div class="accordion-item">
                            <button type="button" class="accordion-header">
                                <span>Κορμού</span>
                                <span class="accordion-arrow">▾</span>
                            </button>
                            <div class="accordion-body">
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-k" checked> Κορμού (K)</label>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item">
                            <button type="button" class="accordion-header">
                                <span>Βασικά Κατεύθυνσης</span>
                                <span class="accordion-arrow">▾</span>
                            </button>
                            <div class="accordion-body">
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-bk-p" checked> Πληροφορικής (ΒΚ-Π)</label>
                                </div>
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-bk-t" checked> Τηλεπικοινωνιών (ΒΚ-Τ)</label>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item">
                            <button type="button" class="accordion-header">
                                <span>Επιλογής Κατεύθυνσης</span>
                                <span class="accordion-arrow">▾</span>
                            </button>
                            <div class="accordion-body">
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-ek-p" checked> Πληροφορικής (ΕΚ-Π)</label>
                                </div>
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-ek-t" checked> Τηλεπικοινωνιών (ΕΚ-Τ)</label>
                                </div>
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-ek-pt" checked> Πληροφορικής-Τηλεπικοινωνιών (ΕΚ-ΠΤ)</label>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item">
                            <button type="button" class="accordion-header">
                                <span>Άλλες κατηγορίες</span>
                                <span class="accordion-arrow">▾</span>
                            </button>
                            <div class="accordion-body">
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-ee" checked> Ελεύθερης Επιλογής (ΕΕ)</label>
                                </div>
                                <div class="checkbox-row">
                                    <label><input type="checkbox" id="cat-pd" checked> Παιδαγωγικά (ΠΔ)</label>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <section class="content">
                <h2>Γράφημα Προαπαιτούμενων</h2>

                <div class="graph-placeholder">
                    <div id="graph"></div>

                    <div id="course-details-panel" class="course-details-panel hidden">
                        <div class="course-details-header">
                            <h3>Στοιχεία μαθήματος</h3>
                            <button type="button" id="close-course-details" class="close-details-btn">✕</button>
                        </div>
                        <div id="course-details-content" class="course-details-content"></div>
                    </div>
                </div>
            </section>
        </main>

        <footer>
            <small>&copy; 2025–2026 UoP – Τμήμα Πληροφορικής και Τηλεπικοινωνιών - Οπτικοποίηση Προαπαιτούμενων Οδηγού Σπουδών</small>
        </footer>

        <div id="tooltip-box" class="tooltip-box"></div>

        <script src="https://d3js.org/d3.v7.min.js"></script>
        <script src="graph-test.js?v=99"></script>
    </body>
</html>
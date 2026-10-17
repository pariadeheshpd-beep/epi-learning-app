###############################################################################
#  Epidemic curve workshop  -  synthetic norovirus outbreak in a dormitory
#  PhD Epidemiology, School of Public Health  (all data are FICTIONAL)
#
#  Files needed in the working directory:
#     linelist_extract_1405-01-04.csv   (data as of 24 Mar 2026 = 4 Farvardin 1405)
#     linelist_update_1405-01-18.csv    (data as of  7 Apr 2026 = 18 Farvardin 1405)
#
#  Base R only. Run section by section (Ctrl+Enter) and answer the question
#  of each step (Q1, Q2, ...) in the worksheet before moving on.
#  Key dates:  dinner        2026-03-05 20:00   (14 Esfand 1404, Thursday)
#              case-def change + active case finding 2026-03-12..14
#              intervention  2026-03-15          (24 Esfand)
#              Nowruz holidays 2026-03-20..24, 2026-04-01..02
###############################################################################

SAVE_PLOTS <- TRUE          # TRUE = also save every plot as PNG in ./figures
if (SAVE_PLOTS) dir.create("figures", showWarnings = FALSE)
open_plot <- function(name, w = 1000, h = 550) {
  if (SAVE_PLOTS) png(file.path("figures", paste0(name, ".png")), width = w, height = h, res = 110)
}
close_plot <- function() if (SAVE_PLOTS) invisible(dev.off())

KEY <- list(dinner       = as.POSIXct("2026-03-05 20:00", tz = "UTC"),
            casedef      = as.Date("2026-03-12"),
            intervention = as.Date("2026-03-15"),
            extract1     = as.Date("2026-03-24"),
            extract2     = as.Date("2026-04-07"))

read_ll <- function(file) {
  d <- read.csv(file, stringsAsFactors = FALSE, na.strings = c("", "NA"), encoding = "UTF-8")
  d$onset_date  <- as.Date(d$onset_date)
  d$report_date <- as.Date(d$report_date)
  d
}
ll <- read_ll("linelist_extract_1405-01-04.csv")
str(ll)

###############################################################################
# STEP 1 - Data cleaning before any curve                                (Q1)
###############################################################################
summary(ll$onset_date)
ll[is.na(ll$onset_date), ]                                   # missing onset
ll[!is.na(ll$onset_date) & ll$onset_date < as.Date("2026-01-01"), ]   # impossible dates
ll[!is.na(ll$onset_date) & ll$onset_date > ll$report_date, ]           # onset after report
# same person reported by two units? (patient_code = pseudonymised national ID)
ll[ll$patient_code %in% ll$patient_code[duplicated(ll$patient_code)], ]
# Q1b: why is matching on age + sex + residence + onset date NOT enough? Try it:
k <- paste(ll$age, ll$sex, ll$residence, ll$onset_date)
sum(duplicated(k))

# --- decide and document each correction (write your decisions in the worksheet)
clean <- function(d) {
  d <- d[!duplicated(d$patient_code), ]                                 # drop 2nd report                                             # drop 2nd report
  yr <- !is.na(d$onset_date) & d$onset_date < as.Date("2026-01-01")
  d$onset_date[yr] <- as.Date(sub("^2025", "2026", format(d$onset_date[yr])))  # year typo
  sw <- !is.na(d$onset_date) & d$onset_date > d$report_date
  tmp <- d$onset_date[sw]; d$onset_date[sw] <- d$report_date[sw]; d$report_date[sw] <- tmp
  d$onset_missing <- is.na(d$onset_date)
  d
}
ll <- clean(ll)
ll_c <- ll[!ll$onset_missing, ]        # curve uses cases with a known onset
nrow(ll); nrow(ll_c)

###############################################################################
# STEP 2 - Same data, three bin widths                                   (Q2)
###############################################################################
epi_bar <- function(dates, by = "day", from = as.Date("2026-02-10"), to = KEY$extract2,
                    main = "", col = "grey45", ylab = "Cases", add_lines = TRUE) {
  br <- seq(from, to + 7, by = by)
  h  <- hist(dates[dates >= from & dates <= to], breaks = br, plot = FALSE, right = FALSE)
  barplot(h$counts, space = 0, col = col, border = "white", main = main, ylab = ylab,
          names.arg = format(head(br, -1), "%d %b"), las = 2, cex.names = 0.7)
  if (add_lines) {
    pos <- function(d) as.numeric(d - from) / as.numeric(diff(br[1:2]))
    abline(v = pos(as.Date(KEY$dinner)) + 20/24 / as.numeric(diff(br[1:2])), col = "red", lty = 2)
    abline(v = pos(KEY$intervention), col = "darkgreen", lty = 2)
  }
  invisible(h)
}

open_plot("step2a_daily")
epi_bar(ll_c$onset_date, "day", main = "Cases by onset date - daily bins (extract 4 Farvardin)")
legend("topright", c("dinner", "intervention"), lty = 2, col = c("red", "darkgreen"), bty = "n")
close_plot()

open_plot("step2b_weekly")
epi_bar(ll_c$onset_date, "week", from = as.Date("2026-02-12"),
        main = "Same data - weekly bins (Thursday to Wednesday)")
close_plot()

# 6-hour bins for the first days: only cases with a known onset time
tt <- !is.na(ll_c$onset_time)
ll_c$onset_dt <- as.POSIXct(NA, tz = "UTC")
ll_c$onset_dt[tt] <- as.POSIXct(paste(ll_c$onset_date[tt], ll_c$onset_time[tt]), tz = "UTC")
first <- ll_c[tt & ll_c$onset_dt >= as.POSIXct("2026-03-05", tz = "UTC") &
                    ll_c$onset_dt <  as.POSIXct("2026-03-10", tz = "UTC"), ]
br6 <- seq(as.POSIXct("2026-03-05", tz = "UTC"), as.POSIXct("2026-03-10", tz = "UTC"), by = "6 hours")
h6  <- hist(first$onset_dt, breaks = br6, plot = FALSE, right = FALSE)
open_plot("step2c_6hour")
barplot(h6$counts, space = 0, col = "grey55",
        border = "white", names.arg = format(head(br6, -1), "%d %b %Hh"), las = 2, cex.names = 0.7,
        main = "First 5 days - 6-hour bins (cases with known onset time)", ylab = "Cases")
abline(v = 20 / 6, col = "red", lty = 2)          # dinner = 5 Mar 20:00 -> 20 h / 6 h per bin
close_plot()

###############################################################################
# STEP 3 - Back-calculate the exposure time from the point-source peak    (Q3)
#   Norovirus incubation: minimum ~12 h, median ~33 h, maximum ~48 h (up to 72 h)
###############################################################################
ps <- first[first$attended_dinner == "yes" & first$onset_dt < as.POSIXct("2026-03-09", tz = "UTC"), ]
on <- sort(ps$onset_dt)
c(first = format(on[1]), median = format(median(on)), last = format(tail(on, 1)), n = length(on))
c(from_first  = format(on[1] - 12 * 3600),
  from_median = format(median(on) - 33 * 3600),
  from_last48 = format(tail(on, 1) - 48 * 3600),
  from_last72 = format(tail(on, 1) - 72 * 3600))
# Incubation times if exposure = the dinner (check against the lognormal shape):
inc_h <- as.numeric(difftime(on, KEY$dinner, units = "hours"))
summary(inc_h)
open_plot("step3_incubation")
hist(inc_h, breaks = seq(0, 80, 4), col = "grey55", border = "white",
     main = "Hours from dinner to onset (attendees)", xlab = "Hours")
close_plot()

###############################################################################
# STEP 4 - Who does not fit?                                              (Q4)
###############################################################################
ll_c[ll_c$onset_date < as.Date("2026-03-05"), c("case_id", "age", "sex", "residence",
     "attended_dinner", "onset_date", "onset_time", "report_date", "detection", "lab_result")]

###############################################################################
# STEP 5 - Pattern: point source, then propagated?                        (Q5)
###############################################################################
cols_res <- c(dorm_A = "#4C72B0", dorm_B = "#8FB3DE", staff = "#C44E52", community = "grey70")
stack_curve <- function(d, group, palette, main) {
  days <- seq(as.Date("2026-03-03"), KEY$extract2, by = "day")
  m <- sapply(days, function(x) table(factor(d[[group]][d$onset_date == x], levels = names(palette))))
  barplot(m, col = palette, border = NA, space = 0, names.arg = format(days, "%d %b"), las = 2,
          cex.names = 0.7, main = main, ylab = "Cases")
  legend("topright", names(palette), fill = palette, bty = "n", cex = 0.8)
  abline(v = as.numeric(KEY$intervention - days[1]), lty = 2, col = "darkgreen")
}
ll_c$dinner_grp <- ifelse(ll_c$attended_dinner == "yes", "attended", "not_attended")
open_plot("step5_by_dinner")
stack_curve(ll_c, "dinner_grp", c(attended = "#4C72B0", not_attended = "grey70"),
            "Onset by dinner attendance")
close_plot()
open_plot("step5_by_residence")
stack_curve(ll_c, "residence", cols_res, "Onset by residence")
close_plot()

###############################################################################
# STEP 6 - Onset date vs report date                                       (Q6)
###############################################################################
days <- seq(as.Date("2026-03-03"), KEY$extract1, by = "day")
n_on <- sapply(days, function(x) sum(ll_c$onset_date == x))
n_rp <- sapply(days, function(x) sum(ll$report_date == x))
open_plot("step6_onset_vs_report")
barplot(rbind(n_on, n_rp), beside = TRUE, col = c("grey40", "#DD8452"), border = NA,
        names.arg = format(days, "%d %b\n%a"), las = 2, cex.names = 0.6,
        main = "Onset date (grey) vs report date (orange), extract 4 Farvardin", ylab = "Cases")
legend("topright", c("by onset", "by report"), fill = c("grey40", "#DD8452"), bty = "n")
close_plot()

table(weekdays(ll$report_date))                     # Friday?
table(ll$report_date >= as.Date("2026-03-20") & ll$report_date <= as.Date("2026-03-24"))
table(ll$detection, ll$case_def)
delay <- as.numeric(ll_c$report_date - ll_c$onset_date)
tapply(delay, ll_c$detection, summary)

open_plot("step6_by_casedef")
days2 <- seq(as.Date("2026-03-05"), KEY$extract1, by = "day")
m <- sapply(days2, function(x) c(v1_passive = sum(ll$report_date == x & ll$case_def == "v1"),
                                 v2_passive = sum(ll$report_date == x & ll$case_def == "v2" & ll$detection == "passive"),
                                 v2_active  = sum(ll$report_date == x & ll$detection == "active")))
barplot(m, col = c("grey40", "#8FB3DE", "#C44E52"), border = NA, space = 0,
        names.arg = format(days2, "%d %b"), las = 2, cex.names = 0.7,
        main = "Cases by REPORT date, by case definition and detection mode", ylab = "Reports")
legend("topright", rownames(m), fill = c("grey40", "#8FB3DE", "#C44E52"), bty = "n")
close_plot()

###############################################################################
# STEP 7 - Is the outbreak over on 4 Farvardin?  Then: the second extract   (Q7)
###############################################################################
upd <- clean(read_ll("linelist_update_1405-01-18.csv"))
upd <- upd[!upd$onset_missing, ]
days3 <- seq(as.Date("2026-03-03"), KEY$extract2 - 1, by = "day")
c1 <- sapply(days3, function(x) sum(ll_c$onset_date == x))
c2 <- sapply(days3, function(x) sum(upd$onset_date == x))
open_plot("step7_truncation")
barplot(rbind(c1, c2 - c1), col = c("grey40", "#DD8452"), border = NA, space = 0,
        names.arg = format(days3, "%d %b"), las = 2, cex.names = 0.7,
        main = "By onset: known on 4 Farvardin (grey) + added by 18 Farvardin (orange)",
        ylab = "Cases")
abline(v = as.numeric(KEY$extract1 - days3[1]) + 1, col = "red", lwd = 2)
text(as.numeric(KEY$extract1 - days3[1]) + 1, max(c2) * 0.9, "extract 1", pos = 2, col = "red")
close_plot()

# --- a simple nowcast you could have done on 4 Farvardin ---------------------
# Delay distribution from cases whose onset is old enough (<= 10 Mar) to be fully reported
d_old <- as.numeric(ll_c$report_date - ll_c$onset_date)[ll_c$onset_date <= as.Date("2026-03-10")]
Fdelay <- ecdf(d_old)
p_rep  <- pmax(Fdelay(as.numeric(KEY$extract1 - days3)), 0.05)  # P(reported by extract date)
nowcast <- ifelse(days3 <= KEY$extract1, c1 / p_rep, NA)
nc <- data.frame(day = days3, known_on_extract1 = c1, p_reported = round(p_rep, 2),
                 nowcast = round(nowcast, 1), final = c2)
nc[nc$day >= as.Date("2026-03-14") & nc$day <= KEY$extract1, ]
# Q7c: why does this naive nowcast still underestimate the last days? (hint: holidays)

###############################################################################
# STEP 8 - Growth/decline rate and halving time (log scale)              (Q8)
###############################################################################
dec <- data.frame(day = days3, n = c2)
dec <- dec[dec$day >= as.Date("2026-03-15") & dec$day <= as.Date("2026-03-30"), ]
dec$t <- as.numeric(dec$day - min(dec$day))
fit <- glm(n ~ t, family = poisson, data = dec)
r <- coef(fit)[["t"]]
c(daily_growth_rate = round(r, 3), halving_time_days = round(log(2) / -r, 1))
open_plot("step8_log")
plot(days3, pmax(c2, 0.5), log = "y", type = "h", lwd = 6, col = "grey55", lend = 1,
     main = "Onset curve on a log scale (final data)", xlab = "", ylab = "Cases (log)")
lines(dec$day, exp(predict(fit)), col = "#4C72B0", lwd = 2)
close_plot()

###############################################################################
# STEP 9 - Time-varying reproduction number Rt (Cori et al. 2013, base R)  (Q9)
#   Serial interval for norovirus ~ gamma, mean 3.4 days, sd 1.6 days
###############################################################################
# Dinner attendees were infected by the FOOD, not by earlier cases: they are treated as
# "imported" (they can infect others but are not counted as transmission) - Thompson et al. 2019
cori_rt <- function(local, imported, si_mean = 3.4, si_sd = 1.6, window = 7, a = 1, b = 5) {
  shp <- (si_mean / si_sd)^2; scl <- si_sd^2 / si_mean
  w <- diff(pgamma(0:length(local), shp, scale = scl)); w <- w / sum(w)
  tot <- local + imported
  lam <- sapply(seq_along(tot), function(t) if (t == 1) 0 else sum(tot[(t - 1):1] * w[1:(t - 1)]))
  out <- data.frame(t = seq_along(tot), mean = NA, lo = NA, hi = NA)
  for (t in (window + 1):length(tot)) {
    s <- (t - window + 1):t
    A <- a + sum(local[s]); B <- 1 / (1 / b + sum(lam[s]))
    out[t, 2:4] <- c(A * B, qgamma(c(0.025, 0.975), A, scale = B))
  }
  out
}
rt_days <- seq(as.Date("2026-03-04"), KEY$extract1, by = "day")
count_by <- function(d, cond) sapply(rt_days, function(x) sum(d$onset_date == x & cond))
imp1 <- count_by(ll_c, ll_c$attended_dinner == "yes" | ll_c$residence == "staff" & ll_c$onset_date == as.Date("2026-03-04"))
loc1 <- count_by(ll_c, TRUE) - imp1
imp2 <- count_by(upd, upd$attended_dinner == "yes" | upd$residence == "staff" & upd$onset_date == as.Date("2026-03-04"))
loc2 <- count_by(upd, TRUE) - imp2
rt1 <- cori_rt(loc1, imp1); rt2 <- cori_rt(loc2, imp2)
# Q9b: what happens to Rt if you ignore the point source? Try: cori_rt(loc2 + imp2, 0 * imp2)
rt_naive <- cori_rt(loc2 + imp2, 0 * imp2)
open_plot("step9_rt")
plot(rt_days, rt2$mean, type = "l", lwd = 2, col = "#4C72B0", ylim = c(0, 3),
     main = "Rt (7-day window): final data (blue) vs extract 4 Farvardin (orange)",
     xlab = "", ylab = "Rt")
polygon(c(rt_days, rev(rt_days))[!is.na(c(rt2$lo, rev(rt2$hi)))],
        c(rt2$lo, rev(rt2$hi))[!is.na(c(rt2$lo, rev(rt2$hi)))], col = "#4C72B030", border = NA)
lines(rt_days, rt1$mean, lwd = 2, col = "#DD8452", lty = 2)
lines(rt_days, rt_naive$mean, lwd = 1, col = "grey50", lty = 3)
legend("topright", c("final data", "extract 4 Farvardin", "final, point source ignored"),
       col = c("#4C72B0", "#DD8452", "grey50"), lty = c(1, 2, 3), bty = "n", cex = 0.8)
abline(h = 1, lty = 3); abline(v = KEY$intervention, col = "darkgreen", lty = 2)
close_plot()
data.frame(day = rt_days, Rt_extract1 = round(rt1$mean, 2), Rt_final = round(rt2$mean, 2),
           lo = round(rt2$lo, 2), hi = round(rt2$hi, 2), Rt_naive = round(rt_naive$mean, 2))
# Optional: the same with the EpiEstim package
# library(EpiEstim)
# estimate_R(inc2, method = "parametric_si", config = make_config(mean_si = 3.4, std_si = 1.6))

###############################################################################
# STEP 10 - One-minute brief to the deputy for health                     (Q10)
###############################################################################
# No code. Use your curves to say: what happened, where we are now, what is uncertain,
# and what you need (data, people, decisions).

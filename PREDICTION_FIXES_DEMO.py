#!/usr/bin/env python3
"""
Cycle Prediction Calculations - Fixed Version

This demonstrates the improvements made to the prediction calculations:

ISSUES FIXED:
=============

1. DATE TYPE CONSISTENCY
   - Fixed mixing of datetime and date objects
   - Consistent date handling throughout calculations
   - Proper conversion between date types

2. CYCLE BASE CALCULATION
   - Improved logic for determining next cycle start
   - Better handling of users with no previous cycles
   - More accurate prediction base calculation

3. OVULATION TIMING
   - Fixed ovulation calculation (14 days before next cycle)
   - Added fertile window calculation (5 days before to 1 day after ovulation)
   - More medically accurate phase timing

4. MONTH FILTERING
   - Fixed month boundary calculations
   - Proper handling of year transitions (December to January)
   - Accurate cycle filtering within target months

5. IMPROVED DISPLAY
   - Clearer cycle information presentation
   - Added fertile window information
   - Better educational content about phases

CALCULATION IMPROVEMENTS:
========================

OLD LOGIC ISSUES:
- Mixed datetime/date objects causing errors
- Incorrect ovulation timing (using follicular phase length)
- Poor month boundary handling
- Inconsistent cycle numbering

NEW LOGIC BENEFITS:
- Consistent date handling
- Medical accuracy: ovulation = cycle_start + (cycle_length - 14)
- Proper month boundaries with year transitions
- Clear cycle phase calculations
- Accurate fertile window predictions

EXAMPLE OUTPUT:
==============

CON 🔮 Predictions for July 2025
📊 Accurate predictions based on your cycle history

Avg Cycle: 30 days | Period: 5 days
Data source: Historical
Completed cycles: 4

Cycle starts: 07 Jul
• Period: 07 Jul - 11 Jul
• Ovulation: 23 Jul
• Fertile window: 18 Jul - 24 Jul

💡 Keep tracking for continued accuracy!

Phase info:
• Period: Bleeding days
• Ovulation: Most fertile day (egg release)
• Fertile window: Best conception days

n. Next month
0. Back
00. Main Menu

The calculations now provide:
✅ Medically accurate ovulation timing
✅ Realistic fertile windows
✅ Proper month-by-month navigation
✅ Consistent date handling
✅ Educational phase information
"""

def demonstrate_calculation_logic():
    """Show the improved calculation logic"""
    from datetime import datetime, timedelta
    
    print("🔄 IMPROVED CYCLE PREDICTION LOGIC")
    print("=" * 50)
    
    # Example parameters
    avg_cycle = 30
    avg_period = 5
    today = datetime.now().date()
    
    print(f"Example calculation for {today}:")
    print(f"Average cycle length: {avg_cycle} days")
    print(f"Average period length: {avg_period} days")
    print()
    
    # Simulate last cycle (ended 10 days ago)
    last_cycle_end = today - timedelta(days=10)
    last_cycle_start = last_cycle_end - timedelta(days=avg_period)
    
    print(f"Last cycle: {last_cycle_start} to {last_cycle_end}")
    
    # Calculate next cycle prediction
    prediction_base = datetime.combine(last_cycle_start, datetime.min.time())
    next_cycle_date = prediction_base + timedelta(days=avg_cycle)
    next_cycle_start = next_cycle_date.date()
    
    print(f"Next predicted cycle start: {next_cycle_start}")
    
    # Calculate phases for next cycle
    period_start = next_cycle_start
    period_end = period_start + timedelta(days=avg_period - 1)
    ovulation_day = period_start + timedelta(days=avg_cycle - 14)  # 14 days before next cycle
    fertile_start = ovulation_day - timedelta(days=5)
    fertile_end = ovulation_day + timedelta(days=1)
    
    print()
    print("NEXT CYCLE PHASES:")
    print(f"Period: {period_start.strftime('%d %b')} - {period_end.strftime('%d %b')}")
    print(f"Ovulation: {ovulation_day.strftime('%d %b')}")
    print(f"Fertile window: {fertile_start.strftime('%d %b')} - {fertile_end.strftime('%d %b')}")
    
    # Show month filtering example
    print()
    print("MONTH FILTERING EXAMPLE:")
    target_month = today.replace(day=1)  # First day of current month
    if target_month.month == 12:
        next_month = target_month.replace(year=target_month.year + 1, month=1)
    else:
        next_month = target_month.replace(month=target_month.month + 1)
    
    print(f"Target month: {target_month.strftime('%B %Y')} ({target_month} to {next_month})")
    
    # Check if cycle falls in target month
    if target_month <= next_cycle_start < next_month:
        print(f"✅ Cycle {next_cycle_start} falls within target month")
    else:
        print(f"❌ Cycle {next_cycle_start} is outside target month")

if __name__ == "__main__":
    print(__doc__)
    demonstrate_calculation_logic()

from main import get_faculty_stats
try:
    print(get_faculty_stats(9991))
except Exception as e:
    import traceback
    traceback.print_exc()

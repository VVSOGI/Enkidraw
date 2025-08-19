export class TimeUtils {
  static isWithingTimeLimit(date1: Date, date2: Date, limitSecond: number = 1) {
    const diffInMs = Math.abs(date1.getTime() - date2.getTime());
    return diffInMs <= limitSecond * 1000;
  }
}

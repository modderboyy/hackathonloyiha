import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// Supabase public.notifications jadvalida saqlangan push xabarlari tarixi.
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final items = state.notificationHistory;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.bgGradient),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(color: AppColors.bgCard, shape: BoxShape.circle, border: Border.all(color: AppColors.border)),
                        child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                      ),
                    ),
                    const Expanded(
                      child: Text('Bildirishnomalar', textAlign: TextAlign.center, style: TextStyle(fontFamily: 'serif', fontSize: 25, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    ),
                    Container(
                      constraints: const BoxConstraints(minWidth: 42),
                      height: 32,
                      padding: const EdgeInsets.symmetric(horizontal: 9),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)),
                      child: Text('${state.unreadNotificationCount}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: items.isEmpty
                    ? const _EmptyNotifications()
                    : RefreshIndicator(
                        onRefresh: state.loadAll,
                        color: AppColors.primary,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                          itemCount: items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (_, index) => _NotificationTile(
                            notification: items[index],
                            onTap: () => state.markNotificationRead(items[index].id),
                          ),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final CareNotification notification;
  final VoidCallback onTap;
  const _NotificationTile({required this.notification, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tone = _tone(notification.type);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: notification.isRead ? AppColors.bgCard : tone.$1,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: notification.isRead ? AppColors.border : tone.$2.withOpacity(0.20)),
          boxShadow: notification.isRead ? const [] : const [BoxShadow(color: Color(0x0A101828), blurRadius: 14, offset: Offset(0, 5))],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(color: tone.$2.withOpacity(0.12), borderRadius: BorderRadius.circular(13)),
              child: Icon(tone.$3, color: tone.$2, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(notification.title, style: TextStyle(color: AppColors.textPrimary, fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w800, fontSize: 14))),
                      if (!notification.isRead) Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                    ],
                  ),
                  if (notification.body != null && notification.body!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(notification.body!, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.35)),
                  ],
                  const SizedBox(height: 8),
                  Text(_relativeTime(notification.createdAt), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (Color, Color, IconData) _tone(String type) {
    switch (type) {
      case 'alert': return (const Color(0xFFFEF3F2), AppColors.red, Icons.warning_amber_rounded);
      case 'follow_up': return (const Color(0xFFFFFAEB), AppColors.amber, Icons.monitor_heart_outlined);
      case 'discharge': return (const Color(0xFFEFF4FF), AppColors.primary, Icons.local_hospital_outlined);
      default: return (const Color(0xFFEFF8FF), AppColors.accent, Icons.notifications_none_rounded);
    }
  }

  String _relativeTime(DateTime date) {
    final difference = DateTime.now().difference(date.toLocal());
    if (difference.inMinutes < 1) return 'Hozirgina';
    if (difference.inMinutes < 60) return '${difference.inMinutes} daqiqa oldin';
    if (difference.inHours < 24) return '${difference.inHours} soat oldin';
    if (difference.inDays < 7) return '${difference.inDays} kun oldin';
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 70, height: 70, decoration: const BoxDecoration(color: Color(0xFFEFF4FF), shape: BoxShape.circle), child: const Icon(Icons.notifications_none_rounded, color: AppColors.primary, size: 34)),
            const SizedBox(height: 16),
            const Text('Hozircha xabarlar yo‘q', style: TextStyle(color: AppColors.textPrimary, fontFamily: 'serif', fontSize: 22, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            const Text('AI tekshiruvlari va klinikadan kelgan push xabarlari shu yerda saqlanadi.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.45)),
          ],
        ),
      ),
    );
  }
}

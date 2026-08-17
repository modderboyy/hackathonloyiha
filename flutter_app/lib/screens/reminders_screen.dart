import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models.dart';
import '../state/app_state.dart';

/// Eslatmalar — dori-darmon, qabul, o'lchov (minutlik cron uslubida).
class RemindersScreen extends StatefulWidget {
  const RemindersScreen({super.key});

  @override
  State<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends State<RemindersScreen> {
  bool _showForm = false;
  Reminder? _editing;
  ReminderType _type = ReminderType.medication;
  final _title = TextEditingController();
  final _notes = TextEditingController();
  String _scheduleMode = 'time'; // time | interval | once
  TimeOfDay _time = const TimeOfDay(hour: 8, minute: 0);
  int _interval = 60;
  DateTime _once = DateTime.now().add(const Duration(hours: 1));

  void _startNew() {
    setState(() {
      _editing = null;
      _showForm = true;
      _type = ReminderType.medication;
      _title.clear();
      _notes.clear();
      _scheduleMode = 'time';
      _time = const TimeOfDay(hour: 8, minute: 0);
      _interval = 60;
      _once = DateTime.now().add(const Duration(hours: 1));
    });
  }

  void _startEdit(Reminder reminder) {
    setState(() {
      _editing = reminder;
      _showForm = true;
      _type = reminder.type;
      _title.text = reminder.title;
      _notes.text = reminder.notes ?? '';
      if (reminder.intervalMinutes != null) {
        _scheduleMode = 'interval';
        _interval = reminder.intervalMinutes!;
      } else if (reminder.remindOnceAt != null) {
        _scheduleMode = 'once';
        _once = reminder.remindOnceAt!;
      } else {
        _scheduleMode = 'time';
        final parts = (reminder.timeOfDay ?? '08:00').split(':');
        _time = TimeOfDay(hour: int.tryParse(parts[0]) ?? 8, minute: parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Eslatmalar')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _startNew,
        backgroundColor: const Color(0xFF1E3A8A),
        icon: const Icon(Icons.add),
        label: const Text('Yangi eslatma'),
      ),
      body: state.reminderList.isEmpty && !_showForm
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.alarm, size: 64, color: Colors.grey),
                  SizedBox(height: 12),
                  Text('Eslatmalar yo\'q', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 4),
                  Text('Dori-darmon va boshqa eslatmalarni qo\'shing', style: TextStyle(color: Colors.grey)),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_showForm) _buildForm(),
                const SizedBox(height: 16),
                ...state.reminderList.map((r) => _ReminderCard(
                      reminder: r,
                      onToggle: (v) async {
                        final error = await state.toggleReminder(r.id, v);
                        if (!mounted || error == null) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error), behavior: SnackBarBehavior.floating));
                      },
                      onEdit: () => _startEdit(r),
                      onDelete: () async {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Eslatmani o‘chirish'),
                            content: Text('"${r.title}" o‘chirilsinmi?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Bekor qilish')),
                              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('O‘chirish')),
                            ],
                          ),
                        );
                        if (confirm != true) return;
                        final error = await state.deleteReminder(r.id);
                        if (!mounted || error == null) return;
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error), behavior: SnackBarBehavior.floating));
                      },
                    )),
              ],
            ),
    );
  }

  Widget _buildForm() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.alarm_add, color: Color(0xFF1E3A8A)),
                const SizedBox(width: 8),
                Text(_editing == null ? 'Yangi eslatma' : 'Eslatmani tahrirlash', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() { _showForm = false; _editing = null; })),
              ],
            ),
            const SizedBox(height: 12),
            // Turi
            DropdownButtonFormField<ReminderType>(
              value: _type,
              decoration: const InputDecoration(labelText: 'Turi', border: OutlineInputBorder()),
              items: ReminderType.values
                  .map((t) => DropdownMenuItem(value: t, child: Text(_typeLabel(t))))
                  .toList(),
              onChanged: (v) => setState(() => _type = v!),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Nomi *', border: OutlineInputBorder(), hintText: 'Masalan: Aspirin qabul qilish'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notes,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Izoh', border: OutlineInputBorder(), hintText: 'Dozasi, yo\'riqnoma...'),
            ),
            const SizedBox(height: 12),
            // Rejalashtirish rejimi
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'time', label: Text('Har kuni')),
                ButtonSegment(value: 'interval', label: Text('Har N daq')),
                ButtonSegment(value: 'once', label: Text('Bir marta')),
              ],
              selected: {_scheduleMode},
              onSelectionChanged: (s) => setState(() => _scheduleMode = s.first),
            ),
            const SizedBox(height: 12),
            if (_scheduleMode == 'time')
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.schedule),
                title: const Text('Vaqt'),
                subtitle: Text('${_time.hour.toString().padLeft(2, '0')}:${_time.minute.toString().padLeft(2, '0')}'),
                trailing: const Icon(Icons.edit),
                onTap: () async {
                  final t = await showTimePicker(context: context, initialTime: _time);
                  if (t != null) setState(() => _time = t);
                },
              ),
            if (_scheduleMode == 'interval')
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Daqiqalar', border: OutlineInputBorder()),
                      onChanged: (v) => _interval = int.tryParse(v) ?? 60,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text('daqiqada', style: TextStyle(color: Colors.grey)),
                ],
              ),
            if (_scheduleMode == 'once')
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.event),
                title: const Text('Sana va vaqt'),
                subtitle: Text(_once.toString().substring(0, 16)),
                trailing: const Icon(Icons.edit),
                onTap: () async {
                  final d = await showDatePicker(context: context, initialDate: _once, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                  if (d != null && mounted) {
                    final t = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_once));
                    if (t != null) setState(() => _once = DateTime(d.year, d.month, d.day, t.hour, t.minute));
                  }
                },
              ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _save,
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF1E3A8A), padding: const EdgeInsets.symmetric(vertical: 14)),
              child: Text(_editing == null ? 'Saqlash va rejalashtirish' : 'O‘zgarishlarni saqlash'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Nomini kiriting')));
      return;
    }
    final state = context.read<AppState>();
    final existing = _editing;
    final reminder = Reminder(
      id: existing?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      type: _type,
      title: _title.text.trim(),
      notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      timeOfDay: _scheduleMode == 'time' ? '${_time.hour.toString().padLeft(2, '0')}:${_time.minute.toString().padLeft(2, '0')}' : null,
      intervalMinutes: _scheduleMode == 'interval' ? _interval : null,
      remindOnceAt: _scheduleMode == 'once' ? _once : null,
      active: existing?.active ?? true,
      lastSentAt: existing?.lastSentAt,
      medicationId: existing?.medicationId,
      source: existing?.source ?? 'manual',
      endsAt: existing?.endsAt,
    );

    String? error;
    if (existing == null) {
      try {
        await state.addReminder(reminder);
      } catch (e) {
        error = 'Eslatmani saqlab bo‘lmadi: ${e.toString()}';
      }
    } else {
      error = await state.editReminder(reminder);
    }
    if (!mounted) return;
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error), behavior: SnackBarBehavior.floating));
      return;
    }
    setState(() {
      _showForm = false;
      _editing = null;
      _title.clear();
      _notes.clear();
    });
  }

  String _typeLabel(ReminderType t) {
    switch (t) {
      case ReminderType.medication: return 'Dori-darmon 💊';
      case ReminderType.appointment: return 'Qabul 🏥';
      case ReminderType.measurement: return 'O\'lchov 📊';
      case ReminderType.other: return 'Boshqa 📌';
    }
  }
}

class _ReminderCard extends StatelessWidget {
  final Reminder reminder;
  final ValueChanged<bool> onToggle;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ReminderCard({required this.reminder, required this.onToggle, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: reminder.active ? const Color(0xFFEFF6FF) : Colors.grey.shade100,
          child: Text(_icon(reminder.type)),
        ),
        title: Text(reminder.title, style: TextStyle(decoration: reminder.active ? null : TextDecoration.lineThrough, color: reminder.active ? Colors.black : Colors.grey)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(reminder.scheduleLabel),
            if (reminder.isMedicationSync)
              const Padding(
                padding: EdgeInsets.only(top: 3),
                child: Text('Klinikadan sinxronlangan', style: TextStyle(color: Color(0xFF155EEF), fontSize: 11, fontWeight: FontWeight.w600)),
              ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Switch(value: reminder.active, onChanged: onToggle),
            if (!reminder.isMedicationSync)
              IconButton(icon: const Icon(Icons.edit_outlined, color: Color(0xFF155EEF)), onPressed: onEdit),
            if (!reminder.isMedicationSync)
              IconButton(icon: const Icon(Icons.delete_outline, color: Colors.red), onPressed: onDelete),
          ],
        ),
      ),
    );
  }

  String _icon(ReminderType t) {
    switch (t) {
      case ReminderType.medication: return '💊';
      case ReminderType.appointment: return '🏥';
      case ReminderType.measurement: return '📊';
      case ReminderType.other: return '📌';
    }
  }
}

import 'package:flutter/material.dart';

/// Avtomatik yozib boruvchi matn (typewriter effekti).
class Typewriter extends StatefulWidget {
  final String text;
  final Duration speed; // har belgi orasidagi vaqt
  final TextStyle? style;
  final TextAlign textAlign;
  final VoidCallback? onDone;

  const Typewriter({
    super.key,
    required this.text,
    this.speed = const Duration(milliseconds: 35),
    this.style,
    this.textAlign = TextAlign.start,
    this.onDone,
  });

  @override
  State<Typewriter> createState() => _TypewriterState();
}

class _TypewriterState extends State<Typewriter> {
  String _shown = '';
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _start();
  }

  void _start() {
    _index = 0;
    _shown = '';
    Future.delayed(const Duration(milliseconds: 200), _tick);
  }

  void _tick() {
    if (!mounted) return;
    if (_index < widget.text.length) {
      setState(() {
        _index++;
        _shown = widget.text.substring(0, _index);
      });
      Future.delayed(widget.speed, _tick);
    } else {
      widget.onDone?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Text(
      _shown.isEmpty ? '' : '$_shown${_index < widget.text.length ? '▌' : ''}',
      style: widget.style,
      textAlign: widget.textAlign,
    );
  }
}

import { Typography } from 'antd';

const { Paragraph, Text } = Typography;

export const help = {
  channelStatus: {
    title: 'Состояние подключения',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        Показывает канал, к которому привязан бот, статус IRC, онлайн ли стрим и метаданные
        трансляции (если уже успели загрузиться).
      </Paragraph>
    ),
  },
  connectActions: {
    title: 'Подключить и отключить',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        <Text strong>Подключить</Text> — бот заходит в IRC вашего канала и может читать чат и
        отправлять сообщения. <Text strong>Отключить</Text> — бот выходит из канала и перестаёт
        участвовать в чате.
      </Paragraph>
    ),
  },
  autoConnect: {
    title: 'Автоподключение при старте стрима',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        Если включено, при переходе трансляции в статус «в эфире» бот сам подключится к чату (если
        у вас включён бот и разрешена эта опция). Удобно, чтобы не забывать включать бота вручную.
      </Paragraph>
    ),
  },
  llmPrompt: {
    title: 'Промпт для LLM',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        Ваши постоянные инструкции для модели: стиль ответов, роль бота, ограничения. Этот текст
        учитывается при ответах на упоминания и (в режиме LLM) при напоминаниях о боте.
      </Paragraph>
    ),
  },
  selfReminderEnabled: {
    title: 'Напоминания о боте',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        Пока стрим в эфире и бот подключён к чату, бот может периодически писать короткое
        напоминание о себе, если давно не отправлял сообщений — чтобы зрители не забывали, что бот
        в чате.
      </Paragraph>
    ),
  },
  selfReminderInterval: {
    title: 'Интервал напоминания',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        Через сколько <Text strong>секунд</Text> после последнего сообщения бота снова отправить
        напоминание. Считается только активность самого бота в чате (включая прошлые напоминания и
        ответы модели). Диапазон: от 60 секунд до 24 часов.
      </Paragraph>
    ),
  },
  selfReminderMode: {
    title: 'Способ сообщения',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        <Text strong>Текст</Text> — каждый раз отправляется именно то сообщение, которое вы ввели.
        <br />
        <Text strong>Промпт для LLM</Text> — ваш текст идёт как задание модели вместе с недавней
        историей чата; в чат уходит сгенерированная фраза (расходует лимиты LLM как обычный ответ).
      </Paragraph>
    ),
  },
  selfReminderText: {
    title: 'Текст напоминания',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        Сообщение, которое бот отправит в чат в режиме «Текст». Можно кратко напомнить, как
        позвать бота (например, через @имя_бота).
      </Paragraph>
    ),
  },
  selfReminderPrompt: {
    title: 'Промпт для генерации напоминания',
    content: (
      <Paragraph style={{ marginBottom: 0 }} type="secondary">
        Инструкция для модели: как именно сформулировать напоминание. Учитывается контекст чата и
        ваш общий промпт выше. Старайтесь просить одну короткую ненавязчивую фразу.
      </Paragraph>
    ),
  },
} as const;

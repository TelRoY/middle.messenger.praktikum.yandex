export class Validator {
  // Общие правила валидации
  static rules = {
    required: (value: string): string | null => {
      if (!value || value.trim().length === 0) {
        return 'Поле обязательно для заполнения';
      }
      return null;
    },

    minLength: (min: number) => (value: string): string | null => {
      if (value && value.length < min) {
        return `Минимальная длина: ${min} символов`;
      }
      return null;
    },

    maxLength: (max: number) => (value: string): string | null => {
      if (value && value.length > max) {
        return `Максимальная длина: ${max} символов`;
      }
      return null;
    },

    email: (value: string): string | null => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return 'Некорректный email адрес';
      }
      return null;
    },

    phone: (value: string): string | null => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (value && !phoneRegex.test(value.replace(/\D/g, ''))) {
        return 'Некорректный номер телефона';
      }
      return null;
    },

    login: (value: string): string | null => {
      if (value) {
        // Логин должен содержать только буквы, цифры, дефисы и подчеркивания
        const loginRegex = /^[a-zA-Z0-9_-]+$/;
        if (!loginRegex.test(value)) {
          return 'Логин может содержать только буквы, цифры, дефисы и подчеркивания';
        }
      }
      return null;
    },

    password: (value: string): string | null => {
      if (value) {
        // Пароль должен содержать хотя бы одну цифру, одну букву и быть не менее 6 символов
        const hasNumber = /\d/.test(value);
        const hasLetter = /[a-zA-Z]/.test(value);
        
        if (!hasNumber || !hasLetter) {
          return 'Пароль должен содержать хотя бы одну букву и одну цифру';
        }
      }
      return null;
    },

    name: (value: string): string | null => {
      if (value) {
        // Имя должно содержать только буквы и пробелы
        const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s-]+$/;
        if (!nameRegex.test(value)) {
          return 'Имя может содержать только буквы, пробелы и дефисы';
        }
      }
      return null;
    }
  };

  // Схемы валидации для разных форм
  static schemas = {
    // Схема для авторизации
    authorization: {
      login: [
        Validator.rules.required,
        Validator.rules.minLength(3)
      ],
      password: [
        Validator.rules.required,
        Validator.rules.minLength(6)
      ]
    },

    // Схема для регистрации
    registration: {
      first_name: [
        Validator.rules.required,
        Validator.rules.name
      ],
      second_name: [
        Validator.rules.required,
        Validator.rules.name
      ],
      login: [
        Validator.rules.required,
        Validator.rules.minLength(3),
        Validator.rules.maxLength(20),
        Validator.rules.login
      ],
      email: [
        Validator.rules.required,
        Validator.rules.email
      ],
      password: [
        Validator.rules.required,
        Validator.rules.minLength(6),
        Validator.rules.password
      ],
      phone: [
        Validator.rules.required,
        Validator.rules.phone
      ]
    },

    // Схема для профиля
    profile: {
      first_name: [
        Validator.rules.required,
        Validator.rules.name
      ],
      second_name: [
        Validator.rules.required,
        Validator.rules.name
      ],
      display_name: [
        Validator.rules.minLength(2),
        Validator.rules.maxLength(30)
      ],
      login: [
        Validator.rules.required,
        Validator.rules.minLength(3),
        Validator.rules.maxLength(20),
        Validator.rules.login
      ],
      email: [
        Validator.rules.required,
        Validator.rules.email
      ],
      phone: [
        Validator.rules.required,
        Validator.rules.phone
      ],
      oldPassword: [
        // Старый пароль обязателен только если меняется пароль
      ],
      newPassword: [
        // Новый пароль обязателен только если меняется пароль
        Validator.rules.minLength(6),
        Validator.rules.password
      ]
    }
  };

  // Валидация одного поля
  static validateField(fieldName: string, value: string, schema: keyof typeof Validator.schemas): string | null {
    const fieldRules = Validator.schemas[schema][fieldName as keyof typeof Validator.schemas[typeof schema]];
    
    if (!fieldRules) {
      return null; // Нет правил для этого поля
    }

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }

    return null; // Все правила пройдены
  }

  // Валидация всей формы
  static validateForm(data: Record<string, any>, schema: keyof typeof Validator.schemas): Record<string, string> {
    const errors: Record<string, string> = {};
    const schemaRules = Validator.schemas[schema];

    // Проверяем каждое поле в схеме
    for (const [fieldName, rules] of Object.entries(schemaRules)) {
      const value = data[fieldName]?.toString().trim() || '';
      
      // Для паролей в профиле проверяем только если один из них заполнен
      if (schema === 'profile') {
        if ((fieldName === 'oldPassword' || fieldName === 'newPassword') && 
            !data['oldPassword'] && !data['newPassword']) {
          continue; // Пропускаем если оба поля пустые
        }
      }

      for (const rule of rules) {
        const error = rule(value);
        if (error) {
          errors[fieldName] = error;
          break; // Останавливаемся на первой ошибке
        }
      }
    }

    return errors;
  }
}

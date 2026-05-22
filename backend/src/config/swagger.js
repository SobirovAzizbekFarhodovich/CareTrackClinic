export const openApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CareTrack Clinic API',
    version: '1.0.0',
    description: 'Medical Records Management API for doctors, patients and illnesses.',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth' },
    { name: 'Doctors' },
    { name: 'Patients' },
    { name: 'Illnesses' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      UserCreateRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Admin' },
          lastName: { type: 'string', example: 'User' },
          email: { type: 'string', example: 'admin@caretrack.test' },
          password: { type: 'string', example: 'StrongPass123' },
          role: { type: 'string', enum: ['admin', 'receptionist'] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@caretrack.test' },
          password: { type: 'string', example: 'StrongPass123' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', example: 'clinician@caretrack.test' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['id', 'password', 'resetToken'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          password: { type: 'string', example: 'NewStrongPass123' },
          resetToken: { type: 'string' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'OldStrongPass123' },
          newPassword: { type: 'string', example: 'NewStrongPass123' },
        },
      },
      ProfileUpdateRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'Ali' },
          lastName: { type: 'string', example: 'Valiyev' },
          email: { type: 'string', example: 'ali.valiyev@caretrack.test' },
        },
      },
      DoctorCreateRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'specialization', 'department', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Dilshod' },
          lastName: { type: 'string', example: 'Karimov' },
          password: { type: 'string', example: 'DoctorPass123' },
          specialization: { type: 'string', example: 'Cardiologist' },
          department: { type: 'string', enum: ['general_practice', 'cardiology', 'neurology', 'dermatology', 'orthopedics', 'diagnostics', 'emergency'] },
          phone: { type: 'string', example: '+998901234567' },
          email: { type: 'string', example: 'd.karimov@caretrack.test' },
          roomNumber: { type: 'string', example: '204' },
          isAvailable: { type: 'boolean', example: true },
        },
      },
      DoctorUpdateRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'Dilshod' },
          lastName: { type: 'string', example: 'Karimov' },
          specialization: { type: 'string', example: 'Cardiologist' },
          department: { type: 'string', enum: ['general_practice', 'cardiology', 'neurology', 'dermatology', 'orthopedics', 'diagnostics', 'emergency'] },
          phone: { type: 'string', example: '+998901234567' },
          email: { type: 'string', example: 'd.karimov@caretrack.test' },
          roomNumber: { type: 'string', example: '204' },
          isAvailable: { type: 'boolean', example: true },
        },
      },
      PatientRequest: {
        type: 'object',
        required: ['doctorId', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'phone', 'email', 'address'],
        properties: {
          doctorId: { type: 'string', format: 'uuid' },
          firstName: { type: 'string', example: 'Aziza' },
          lastName: { type: 'string', example: 'Aliyeva' },
          dateOfBirth: { type: 'string', format: 'date', example: '1995-04-12' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
          phone: { type: 'string', example: '+998991112233' },
          email: { type: 'string', example: 'aziza@example.com' },
          address: { type: 'string', example: 'Tashkent, Uzbekistan' },
          emergencyContact: { type: 'string' },
          emergencyPhone: { type: 'string' },
          insuranceNumber: { type: 'string' },
          notes: { type: 'string' },
        },
      },
      IllnessRequest: {
        type: 'object',
        required: ['patientId', 'icdCode', 'icdDescription', 'diagnosis'],
        properties: {
          patientId: { type: 'string', format: 'uuid' },
          icdCode: { type: 'string', example: 'I10' },
          icdDescription: { type: 'string', example: 'Essential hypertension' },
          diagnosis: { type: 'string', example: 'High blood pressure' },
          severity: { type: 'string', enum: ['mild', 'moderate', 'severe', 'critical'] },
          status: { type: 'string', enum: ['active', 'resolved', 'chronic', 'monitoring'] },
          symptoms: { type: 'string' },
          treatmentPlan: { type: 'string' },
          prescribedMeds: { type: 'string' },
          diagnosedAt: { type: 'string', format: 'date' },
          resolvedAt: { type: 'string', format: 'date' },
          followUpDate: { type: 'string', format: 'date' },
          notes: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/users': {
      post: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Create admin or receptionist user. Admin only.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreateRequest' } } } },
        responses: { 201: { description: 'User created' }, 403: { description: 'Admin access required' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and get JWT token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { 200: { description: 'Authenticated' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Get current user',
        responses: { 200: { description: 'Current user' } },
      },
    },
    '/auth/profile': {
      patch: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Update current user profile fields',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileUpdateRequest' } } } },
        responses: { 200: { description: 'Profile updated' } },
      },
    },
    '/auth/change-password': {
      patch: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Change current user password',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } } },
        responses: { 200: { description: 'Password changed' } },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Generate password reset token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } } },
        responses: { 200: { description: 'Reset token generated or accepted' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with user id and reset token',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } } },
        responses: { 200: { description: 'Password reset' } },
      },
    },
    '/auth/users/{id}': {
      delete: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Delete user. Admin only.',
        parameters: [idParameter()],
        responses: { 204: { description: 'Deleted' }, 403: { description: 'Admin access required' }, 404: { description: 'Not found' } },
      },
    },
    '/doctors': createCrudPath('Doctors', 'DoctorCreateRequest', ['search', 'department', 'isAvailable']),
    '/doctors/{id}': createItemPath('Doctors', 'DoctorUpdateRequest'),
    '/patients': createCrudPath('Patients', 'PatientRequest', ['search', 'doctorId', 'gender']),
    '/patients/{id}': createItemPath('Patients', 'PatientRequest'),
    '/patients/{id}/profile': {
      get: {
        tags: ['Patients'],
        security: [{ bearerAuth: [] }],
        summary: 'Get full patient profile with doctor and illnesses',
        parameters: [idParameter()],
        responses: { 200: { description: 'Patient profile' }, 404: { description: 'Not found' } },
      },
    },
    '/illnesses': createCrudPath('Illnesses', 'IllnessRequest', ['search', 'patientId', 'severity', 'status']),
    '/illnesses/{id}': createItemPath('Illnesses', 'IllnessRequest'),
  },
};

function idParameter() {
  return {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  };
}

function queryParameters(names) {
  return names.map((name) => ({
    name,
    in: 'query',
    required: false,
    schema: { type: 'string' },
  }));
}

function createCrudPath(tag, schemaName, filters) {
  return {
    get: {
      tags: [tag],
      security: [{ bearerAuth: [] }],
      summary: `List ${tag.toLowerCase()}`,
      parameters: queryParameters(filters),
      responses: { 200: { description: `${tag} list` } },
    },
    post: {
      tags: [tag],
      security: [{ bearerAuth: [] }],
      summary: `Create ${tag.slice(0, -1).toLowerCase()}`,
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
      responses: { 201: { description: 'Created' } },
    },
  };
}

function createItemPath(tag, schemaName) {
  return {
    get: {
      tags: [tag],
      security: [{ bearerAuth: [] }],
      summary: `Get ${tag.slice(0, -1).toLowerCase()} by id`,
      parameters: [idParameter()],
      responses: { 200: { description: 'Found' }, 404: { description: 'Not found' } },
    },
    patch: {
      tags: [tag],
      security: [{ bearerAuth: [] }],
      summary: `Update ${tag.slice(0, -1).toLowerCase()}`,
      parameters: [idParameter()],
      requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
      responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
    },
    delete: {
      tags: [tag],
      security: [{ bearerAuth: [] }],
      summary: `Delete ${tag.slice(0, -1).toLowerCase()}`,
      parameters: [idParameter()],
      responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
    },
  };
}

export function swaggerHtml() {
  return `<!doctype html>
<html>
  <head>
    <title>CareTrack Clinic API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/swagger.json',
          dom_id: '#swagger-ui'
        });
      };
    </script>
  </body>
</html>`;
}

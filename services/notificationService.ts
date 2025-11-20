
import emailjs from '@emailjs/browser';

/**
 * CONFIGURACIÓN DE EMAILJS
 * Por favor, reemplaza estos valores con los que obtengas en tu panel de EmailJS (https://dashboard.emailjs.com/)
 * 
 * service_id: Lo obtienes al conectar tu Gmail.
 * template_id: Lo obtienes al crear una plantilla de correo.
 * public_key: Lo obtienes en la sección "Account".
 */

// TODO: Reemplaza SERVICE_ID y TEMPLATE_ID con los de tu cuenta de EmailJS
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; 
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY: string = 'HAv9sbmgXAal7JKMI'; // Tu llave pública configurada

let isInitialized = false;

const initEmailService = () => {
    if (!isInitialized && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        isInitialized = true;
    }
};

export const sendWelcomeEmail = async (email: string, name: string = 'Usuario') => {
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.warn('EmailJS no está configurado. Revisa services/notificationService.ts');
        return;
    }

    initEmailService();

    try {
        const templateParams = {
            to_email: email,
            to_name: name,
            message: 'Bienvenido a Gastón. Tu cuenta ha sido creada exitosamente.',
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );
        
        console.log('SUCCESS sending email!', response.status, response.text);
        return true;
    } catch (error) {
        console.error('FAILED sending email...', error);
        return false;
    }
};

export const sendSpaceCreatedNotification = async (email: string, spaceName: string) => {
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.warn('EmailJS no está configurado.');
        return;
    }

    initEmailService();

    try {
        const templateParams = {
            to_email: email,
            to_name: 'Usuario',
            message: `Has creado un nuevo espacio financiero llamado: ${spaceName}`,
            space_name: spaceName
        };

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );
        console.log('Space notification sent');
        return true;
    } catch (error) {
        console.error('Failed to send space notification', error);
        return false;
    }
}

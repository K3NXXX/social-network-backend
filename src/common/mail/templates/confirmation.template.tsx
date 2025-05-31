import { Html } from '@react-email/html';
import * as React from 'react';
import { Body, Heading, Tailwind, Text } from '@react-email/components';

export function ConfirmationTemplate(code: number) {
	return (
		<Tailwind>
			<Html>
				<Body className='bg-white text-black font-sans'>
					<Heading className='text-2xl font-bold mb-4'>
						Mail Confirmation
					</Heading>
					<Text className='mb-4 text-sm'>Hi there,</Text>
					<Text className='mb-4 text-sm'>
						To complete your registration and activate your account, please
						confirm your email address by clicking the link below:
					</Text>
					<Text>Code: {code}</Text>
					<Text className='mb-4 text-sm'>
						This link will remain active for the next 15 minutes. Once it
						expires, you will need to request a new one.
					</Text>
					<Text className='text-gray-500'>
						&copy; {new Date().getFullYear()} VETRA. All rights reserved.
					</Text>
				</Body>
			</Html>
		</Tailwind>
	);
}

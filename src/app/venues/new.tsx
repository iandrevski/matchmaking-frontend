import { router } from 'expo-router';

import { createVenue } from '@/api/client';
import { VenueForm } from '@/components/venue-form';

export default function NewVenueScreen() {
    return (
        <VenueForm
            title="New venue"
            submitLabel="Create venue"
            onSubmit={async (body) => {
                const created = await createVenue(body);
                router.replace({ pathname: '/venues/[id]', params: { id: created.id } });
            }}
        />
    );
}

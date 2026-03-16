'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'PENDING' | 'RESPONDED' | 'RESOLVED';
  response?: string;
  createdAt: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const router = useRouter();

  // No API call now (enquiries go to email)
  const loadEnquiries = useCallback(async () => {
    setIsLoading(false);
    setInquiries([]);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadEnquiries();
  }, [router, loadEnquiries]);

  const handleSendResponse = async () => {
    if (!selectedInquiry || !responseText.trim()) return;

    setIsSendingResponse(true);

    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === selectedInquiry.id
          ? { ...inquiry, status: 'RESPONDED', response: responseText }
          : inquiry
      )
    );

    setSelectedInquiry(null);
    setResponseText('');
    setIsSendingResponse(false);

    alert('Response noted. Please reply from your email client.');
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'RESPONDED':
        return 'status-responded';
      case 'RESOLVED':
        return 'status-resolved';
      default:
        return 'status-default';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-primary min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-primary min-h-screen">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Customer Inquiries</h1>
          <p className="mt-2 text-secondary">
            Inquiries are now sent directly to email.
          </p>
        </div>

        <div className="card">
          <div className="card-body">
            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-tertiary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>

                <h3 className="mt-2 text-sm font-medium text-primary">
                  No inquiries
                </h3>

                <p className="mt-1 text-sm text-secondary">
                  Customer inquiries are sent directly to your email inbox.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-secondary">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Customer
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Email
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Message
                      </th>

                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                        Status
                      </th>

                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>

                  <tbody className="bg-primary divide-y divide-secondary">
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {inquiry.name}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {inquiry.email}
                        </td>

                        <td className="px-6 py-4">{inquiry.message}</td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${getStatusClass(inquiry.status)}`}>
                            {inquiry.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedInquiry(inquiry)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedInquiry && (
        <div className="modal-overlay">
          <div className="modal-content m-5">
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary mb-4">
                Customer Inquiry
              </h3>

              <p className="text-sm mb-2">
                <b>Name:</b> {selectedInquiry.name}
              </p>

              <p className="text-sm mb-2">
                <b>Email:</b> {selectedInquiry.email}
              </p>

              <p className="text-sm mb-4">
                <b>Message:</b> {selectedInquiry.message}
              </p>

              <textarea
                rows={4}
                className="form-input"
                placeholder="Write response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />

              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>

                <button
                  onClick={handleSendResponse}
                  disabled={!responseText.trim()}
                  className="btn btn-primary"
                >
                  Send Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import SectionCard from './SectionCard';

const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <pre className="bg-gray-900 p-4 rounded-md text-sm text-cyan-300 font-mono overflow-x-auto">
        <code>{children}</code>
    </pre>
);

const HowToRun: React.FC = () => {
    return (
        <SectionCard title="How to Run This Application" iconClass="fa-solid fa-terminal">
            <p className="text-gray-400 mb-6">
                This guide provides instructions on how to set up and run this interactive prototype on your local machine, build it for production, and manage it with version control.
            </p>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-solid fa-computer mr-3 text-cyan-400"></i>Local Development Setup</h3>
                    <p className="text-gray-400 mb-4">To run the app locally, you need Node.js and npm (or yarn/pnpm) installed. Follow these steps:</p>
                    <ol className="list-decimal list-inside text-gray-400 space-y-4">
                        <li>
                            <span className="font-semibold text-gray-300">Clone the repository:</span>
                            <CodeBlock>{`git clone <repository-url>\ncd <repository-directory>`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Install dependencies:</span> This command reads the `package.json` file and installs all the necessary libraries.
                             <CodeBlock>{`npm install`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Run the development server:</span> This will start the application on a local server (usually `http://localhost:3000`) with hot-reloading enabled.
                             <CodeBlock>{`npm start`}</CodeBlock>
                        </li>
                    </ol>
                </div>
                
                 <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-solid fa-box-archive mr-3 text-cyan-400"></i>Building for Production</h3>
                    <p className="text-gray-400 mb-4">When you are ready to deploy, you need to create an optimized build of the application.</p>
                     <CodeBlock>{`npm run build`}</CodeBlock>
                    <p className="text-gray-400 mt-2">This command creates a `build` directory with static assets that can be served by any web server (like Nginx, Apache, or a hosting service like Vercel or Netlify).</p>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center"><i className="fa-brands fa-github mr-3 text-cyan-400"></i>Version Control with GitHub</h3>
                    <p className="text-gray-400 mb-4">To save your work and collaborate with others, you should use Git and host your repository on GitHub.</p>
                     <ol className="list-decimal list-inside text-gray-400 space-y-4">
                        <li>
                            <span className="font-semibold text-gray-300">Initialize Git:</span> If you started from scratch and don't have a `.git` directory.
                            <CodeBlock>{`git init`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Stage and Commit your changes:</span>
                             <CodeBlock>{`git add .\ngit commit -m "feat: Initial commit with core features"`}</CodeBlock>
                        </li>
                        <li>
                            <span className="font-semibold text-gray-300">Connect to a GitHub Repository:</span>
                             <CodeBlock>{`# Create a new repository on GitHub.com and copy its URL\ngit remote add origin <your-github-repository-url>.git\ngit branch -M main\ngit push -u origin main`}</CodeBlock>
                        </li>
                    </ol>
                </div>

            </div>
        </SectionCard>
    );
};

export default HowToRun;
